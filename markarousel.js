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

    function process() {
        injectStyle();
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
        const images = insertImages(imageSpecs, container);
        controller.setImages(images);
        addControlButtons(container, controller);
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
        return { next, prev, show, count, setLinks, setImages };
    }

    function insertCarouselContainer(imageList) {
        const div = document.createElement("div");
        div.className = "markarousel-container"
        imageList.replaceWith(div);
        return div;
    }

    function insertImages(imageSpecs, container) {
        const images = imageSpecs.map(image => insertImage(image, container));
        return images;
    }

    function insertImage(spec, container) {
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
        zoom.innerHTML = "&#x1F50D;";
        zoom.className = "markarousel-zoom";
        zoom.onclick = function(e) {
            e.preventDefault();
            window.open(spec.src, '_blank');
        };
        div.appendChild(zoom);
        return div;
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

    function injectStyle() {
        const styleContent = `
    
.markarousel-container {
    max-width: ${containerMaxWidth};
    position: relative;
    margin: auto;
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
  right: 20px;
  background-color: rgba(255, 255, 255, 0.7);
  border-radius: 50%;
  padding: 5px;
  cursor: pointer;
  display: none;
  font-size: 20px;
}

.markarousel-container:hover .markarousel-zoom {
    display: block;
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