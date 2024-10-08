Markarousel is a drop-in plugin that creates a simple image carousel on an HTML page generated using Markdown. It can be used on any HTML list as well.

![A picture of the demo](./img/demo.png)

# Usage

In your markdown, create a non-numbered list of pictures or videos somewhere. The alt-text will be used as legend.

```md
- ![This is the first picture](./picture-1.png)
- ![This is the second picture](./picture-2.png)
- [VIDEO: A link to a video](./video-1.mp4)
```

_Note: All elements in the list must be images or videos, or else Markarousel will leave them alone._

Videos are simple URLs prefixed with: VIDEO.

Then include markarousel at the bottom of the page: 
```html
<script src="https://cfe84.github.io/markarousel/markarousel.js"></script>
<script>markarousel()</script>
```

And finally, generate HTML from markdown. When loading it, markarousel will replace your image lists by a carousel. (You can have multiple carousels per page).

You can pass a number of parameters in an options object to markarousel to customize its look and feel. Have a look at the `.js` to find out what they are.

# Why

I'm occasionally writing blog posts of my outdoor adventures, and usually I need to keep the number of images low to keep the flow of text. A carousel is so much better, because it doesn't restrict the number of pictures as much.
