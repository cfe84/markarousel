/**
 * Markarousel, by Charles Feval. Licensed under CC-BY 3.0, please
 * see license on https://github.com/cfe84/markarousel/LICENSE.md
 */

function markarousel(options = {}) {

    const containerMaxWidth = options.containerMaxWidth || "90%";
    const imageMaxHeight = options.imageMaxHeight || "400px";
    const fadeDurationSeconds = options.fadeDurationSeconds || .5;
    const captionsColor = options.captionsColor || "#eee";
    const captionsSize = options.captionsSize || "1em";
    const hoverColor = options.hoverColor || "#08f";
    const buttonsSize = options.buttonsSize || "20px";
    const buttonsColor = options.buttonsColor || "#fff";
    const linkWidth = options.linkWidth || "25px";
    const linkHeight = options.linkHeight || "9px";
    const linkActiveColor = options.linkActiveColor || "#666";
    const linkInactiveColor = options.linkInactiveColor || "#aaa";
    const linkBorderRadius = options.linkBorderRadius || "25%";
    const slideBackground = options.slideBackground || "#222";
    // When > 0, swith to next every X seconds
    const autoTransitionSeconds = options.autoTransitionSeconds || -1;
    let zoomOverlay;

    function process() {
        injectStyle();
        zoomOverlay = createZoomOverlay();
        const imageLists = findImageLists();
        imageLists.forEach(convertListToCarousel);
    }

    /* Detect */

    function findImageLists() {
        const lists = [...document.getElementsByTagName("ul")]
            .filter(isImageList);
        return lists;
    }

    function isImageList(list) {
        const items = [...list.getElementsByTagName("li")];
        return items.find(item => !isImageListItem(item)) === undefined;
    }

    function isImageListItem(listItem) {
        return listItem.childNodes.length === 1 &&
            (listItem.childNodes[0].tagName === "IMG" || 
                (listItem.childNodes[0].tagName === "A" &&
                    listItem.childNodes[0].innerText.startsWith("VIDEO:")
                ));
    }

    /* Convert */

    function convertListToCarousel(imageList) {
        const imageSpecs = getPicturesAndCaptions(imageList);
        const controller = createController();
        const container = insertCarouselContainer(imageList);
        addLinks(container, controller, imageSpecs.length);
        const images = insertImages(imageSpecs, container, controller);
        controller.setImages(images);
        addControlButtons(container, controller);
        addTouchSupport(container, controller);
        controller.show(0);
    }

    function getPicturesAndCaptions(imageList) {
        const items = [...imageList.getElementsByTagName("li")];
        const images = items.map(li => {
            const img = li.firstChild;
            if (img.tagName === "IMG") {
                return {
                    src: img.src,
                    caption: img.alt,
                    type: "image",
                }
            } else {
                return {
                    src: img.href,
                    caption: img.innerText.replace("VIDEO:", "").trim(),
                    type: "video",
                }
            }
            
        });
        return images;
    }

    function createController() {
        let count = 0;
        let index = 0;
        let links = [];
        let images = [];
        let autoTransSecs = autoTransitionSeconds;
        function next() { show((index + 1) % count); };
        function prev() { show((index - 1 + count) % count); autoTransSecs = -1 };
        function getIndex() { return index; }
        function setLinks(newLinks) { links = newLinks };
        function setImages(newImages) { images = newImages; count = images.length; };
        function show(n) {
            
            images.forEach(image => image.style.display = "none");
            images[n].style.display = "block";
            links.forEach(link => link.className = link.className.replace(/markarousel-active/gi, ""));
            if (links.length > n) {
                links[n].className += " markarousel-active";
            }
            index = n;
        };
        function autoTransition() {
            setTimeout(() => {
                if (autoTransSecs <= 0) {
                    return;
                }
                next();
                autoTransition();
            }, autoTransSecs * 1000);
        }
        autoTransition();
        return { next, prev, show, count, setLinks, setImages, getIndex };
    }

    function insertCarouselContainer(imageList) {
        const div = document.createElement("div");
        div.className = "markarousel-container"
        imageList.replaceWith(div);
        return div;
    }

    function insertImages(imageSpecs, container, controller) {
        const images = imageSpecs.map(image => insertImage(image, container, () => controller.getIndex(), controller));
        return images;
    }

    function insertImage(spec, container, getIndex, controller) {
        const div = document.createElement("div");
        div.className = "markarousel-slide";
        div.style.display = "none";
        container.appendChild(div);
        if (spec.type === "image") {
            const img = document.createElement("img");
            img.className = "markarousel-image";
            img.src = spec.src;
            img.alt = spec.caption;
            div.appendChild(img);
        } else {
            const video = document.createElement("video");
            video.controls = true;
            const source = document.createElement("source");
            source.src = spec.src;
            video.appendChild(source);
            div.appendChild(video);
        }
        if (spec.caption) {
            const caption = document.createElement("div");
            caption.className = "markarousel-caption";
            caption.innerText = spec.caption;
            div.appendChild(caption);
        }
        const zoom = document.createElement("div");
        zoom.innerHTML = "&#x2922;";
        zoom.className = "markarousel-zoom";
        zoom.onclick = function(e) {
            e.preventDefault();
            zoomOverlay.show(spec, {
                next: () => {
                    controller.next();
                    return imageSpecsAtIndex(container, getIndex());
                },
                prev: () => {
                    controller.prev();
                    return imageSpecsAtIndex(container, getIndex());
                },
            });
        };
        div.appendChild(zoom);
        return div;
    }

    function imageSpecsAtIndex(container, index) {
        const allSlides = [...container.querySelectorAll(".markarousel-slide")];
        if (!allSlides[index]) {
            return null;
        }
        const img = allSlides[index].querySelector("img, video");
        if (!img) {
            return null;
        }
        if (img.tagName === "IMG") {
            return { src: img.src, caption: img.alt, type: "image" };
        }
        const source = img.querySelector("source");
        return { src: source ? source.src : img.src, caption: allSlides[index].querySelector(".markarousel-caption")?.innerText || "", type: "video" };
    }

    function addControlButtons(container, controller) {
        const prev = document.createElement("a");
        prev.innerText = "<";
        prev.onclick = () => controller.prev();
        prev.className = "markarousel-prev markarousel-control";
        container.appendChild(prev);
        const next = document.createElement("a");
        next.innerText = ">";
        next.onclick = () => controller.next();
        next.className = "markarousel-next markarousel-control";
        container.appendChild(next);
    }

    function addLinks(container, controller, count) {
        const linkContainer = document.createElement("div");
        linkContainer.className = "markarousel-links";
        container.appendChild(linkContainer);
        const links = [];
        for(let i = 0; i < count; i++) {
            const link = document.createElement("span");
            link.className = "markarousel-link";
            link.onclick = () => controller.show(i);
            linkContainer.appendChild(link);
            links.push(link);
        }
        controller.setLinks(links);
    }

    /* Utils */

    function addTouchSupport(container, controller) {
        const swipeThresholdPx = 35;
        let startX = 0;
        let lastX = 0;
        let active = false;

        const startSwipe = (x) => {
            active = true;
            startX = x;
            lastX = x;
        };

        const trackSwipe = (x) => {
            if (!active) {
                return;
            }
            lastX = x;
        };

        const endSwipe = () => {
            if (!active) {
                return;
            }
            const delta = lastX - startX;
            if (Math.abs(delta) > swipeThresholdPx) {
                if (delta < 0) {
                    controller.next();
                } else {
                    controller.prev();
                }
            }
            active = false;
        };

        if (window.PointerEvent) {
            container.addEventListener("pointerdown", (e) => {
                if (e.pointerType === "mouse") {
                    return;
                }
                startSwipe(e.clientX);
            });
            container.addEventListener("pointermove", (e) => trackSwipe(e.clientX));
            container.addEventListener("pointerup", () => endSwipe());
            container.addEventListener("pointerleave", () => endSwipe());
            container.addEventListener("pointercancel", () => endSwipe());
        } else {
            container.addEventListener("touchstart", (e) => startSwipe(e.touches[0].clientX));
            container.addEventListener("touchmove", (e) => trackSwipe(e.touches[0].clientX));
            container.addEventListener("touchend", () => endSwipe());
            container.addEventListener("touchcancel", () => endSwipe());
        }
    }

    function createZoomOverlay() {
        const overlay = document.createElement("div");
        overlay.className = "markarousel-zoom-overlay";

        const content = document.createElement("div");
        content.className = "markarousel-zoom-content";
        overlay.appendChild(content);

        const close = document.createElement("div");
        close.className = "markarousel-zoom-close";
        close.innerText = "\u00d7";
        overlay.appendChild(close);

        const hide = () => {
            overlay.classList.remove("markarousel-zoom-visible");
            content.innerHTML = "";
            document.removeEventListener("keydown", onKeyDown);
            document.body.style.overflow = "";
        };

        const onKeyDown = (e) => {
            if (e.key === "Escape") {
                hide();
                return;
            }
            if (e.key === "ArrowRight" && nav.next) {
                const nextSpec = nav.next();
                if (nextSpec) {
                    e.preventDefault();
                    show(nextSpec, nav);
                }
            }
            if (e.key === "ArrowLeft" && nav.prev) {
                const prevSpec = nav.prev();
                if (prevSpec) {
                    e.preventDefault();
                    show(prevSpec, nav);
                }
            }
        };

        let nav = { next: null, prev: null };
        const show = (spec, navigation) => {
            nav = navigation || { next: null, prev: null };
            content.innerHTML = "";
            if (spec.type === "image") {
                const img = document.createElement("img");
                img.src = spec.src;
                img.alt = spec.caption || "";
                content.appendChild(img);
            } else {
                const video = document.createElement("video");
                video.controls = true;
                video.autoplay = true;
                const source = document.createElement("source");
                source.src = spec.src;
                video.appendChild(source);
                content.appendChild(video);
            }
            if (spec.caption) {
                const caption = document.createElement("div");
                caption.className = "markarousel-zoom-caption";
                caption.innerText = spec.caption;
                content.appendChild(caption);
            }
            overlay.classList.add("markarousel-zoom-visible");
            document.addEventListener("keydown", onKeyDown);
            document.body.style.overflow = "hidden";
        };

        /* Swipe inside overlay to navigate */
        const swipeThresholdPx = 35;
        let startX = 0;
        let lastX = 0;
        let active = false;

        const startSwipe = (x) => {
            active = true;
            startX = x;
            lastX = x;
        };

        const trackSwipe = (x) => {
            if (!active) {
                return;
            }
            lastX = x;
        };

        const endSwipe = () => {
            if (!active) {
                return;
            }
            const delta = lastX - startX;
            if (Math.abs(delta) > swipeThresholdPx) {
                if (delta < 0 && nav.next) {
                    const nextSpec = nav.next();
                    if (nextSpec) {
                        show(nextSpec, nav);
                    }
                } else if (delta > 0 && nav.prev) {
                    const prevSpec = nav.prev();
                    if (prevSpec) {
                        show(prevSpec, nav);
                    }
                }
            }
            active = false;
        };

        const swipeTarget = overlay;
        if (window.PointerEvent) {
            swipeTarget.addEventListener("pointerdown", (e) => {
                startSwipe(e.clientX);
            });
            swipeTarget.addEventListener("pointermove", (e) => trackSwipe(e.clientX));
            swipeTarget.addEventListener("pointerup", () => endSwipe());
            swipeTarget.addEventListener("pointerleave", () => endSwipe());
            swipeTarget.addEventListener("pointercancel", () => endSwipe());
        } else {
            swipeTarget.addEventListener("touchstart", (e) => startSwipe(e.touches[0].clientX));
            swipeTarget.addEventListener("touchmove", (e) => trackSwipe(e.touches[0].clientX));
            swipeTarget.addEventListener("touchend", () => endSwipe());
            swipeTarget.addEventListener("touchcancel", () => endSwipe());
        }

        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) {
                hide();
            }
        });
        close.onclick = hide;

        document.body.appendChild(overlay);
        return { show, hide };
    }

    function injectStyle() {
        const styleContent = `
    
.markarousel-container {
    max-width: ${containerMaxWidth};
    position: relative;
    margin: auto;
    touch-action: pan-y;
}

.markarousel-zoom-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.85);
    display: none;
    align-items: center;
    justify-content: center;
    padding: 20px;
    z-index: 9999;
}

.markarousel-zoom-visible {
    display: flex;
}

.markarousel-zoom-content {
    max-width: 90vw;
    max-height: 90vh;
    text-align: center;
    position: relative;
}

.markarousel-zoom-content img,
.markarousel-zoom-content video {
    max-width: 100%;
    max-height: 80vh;
    box-shadow: 0 10px 35px rgba(0, 0, 0, 0.5);
    border-radius: 6px;
}

.markarousel-zoom-caption {
    color: ${captionsColor};
    margin-top: 10px;
}

.markarousel-zoom-close {
    position: absolute;
    top: 20px;
    right: 30px;
    color: #fff;
    font-size: 30px;
    cursor: pointer;
    user-select: none;
}

.markarousel-slide {
    animation-name: fade;
    animation-duration: ${fadeDurationSeconds}s;
    background: ${slideBackground};
}

.markarousel-slide img {
    width: 100%;
    object-fit: contain;
    max-height: ${imageMaxHeight};
}

.markarousel-slide video {
    width: 100%;
    margin: auto;
    max-height: ${imageMaxHeight};
}

.markarousel-caption {
    color: ${captionsColor};
    font-size: ${captionsSize};
    padding: 10px 0px;
    width: 100%;
    text-align: center;
}

.markarousel-control {
    cursor: pointer;
    user-select: none;
    width: auto;
    position: absolute;
    top: 50%;
    padding: 10px;
    margin-top: -${buttonsSize};
    color: ${buttonsColor};
    font-weight: bold;
    font-size: ${buttonsSize};
    transition: ${fadeDurationSeconds}s;
}

.markarousel-control:hover {
    background-color: ${hoverColor};
}

.markarousel-prev {
    left: 0;
}

.markarousel-next {
    right: 0;
}

.markarousel-links {
    text-align: center;
}

.markarousel-link {
    cursor: pointer;
    height: ${linkHeight};
    width: ${linkWidth};
    margin: 0 2px;
    background-color: ${linkInactiveColor};
    border-radius: ${linkBorderRadius};
    display: inline-block;
    transition: background-color ${fadeDurationSeconds}s;
}

.markarousel-active, .markarousel-link:hover {
  background-color: ${linkActiveColor};
}

.markarousel-zoom {
    position: absolute;
    bottom: 10px;
    right: 10px;
    background-color: rgba(0, 0, 0, 0.6);
    color: #fff;
    border-radius: 50%;
    padding: 6px 7px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    line-height: 1;
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
    opacity: 0.8;
    transition: opacity 0.2s ease, transform 0.2s ease;
}

.markarousel-zoom:hover {
    opacity: 1;
    transform: scale(1.05);
}

@keyframes fade {
  from {opacity: .3}
  to {opacity: 1}
}
`;
        const style = document.createElement("style");
        style.textContent = styleContent;
        document.head.appendChild(style);
    }

    
    process();
}