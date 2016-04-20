# Responsive Images and art direction or viewport/DPR-based selection

When it comes to responsive images there are two main topics that are handled by `<picture>`, `<source>`, `srcset` and `sizes`:


**Viewport/DPR-based selection** is about serving the “best” image to the client. Smaller ones for small screens, larger ones for large screens and larger ones for screens with a higher pixel density (e.g. retina displays). The contents of these images are always the same, no matter how large or small, the aspect ratio and the actual image content is the same. The goal is simply to save bandwidth and processing power on the client.

When it comes to **art direction**, the goal is a bit different. It’s about changing the actual appearance of the image under certain circumstances. E.g. showing a cropped version on smaller screens, a portrait format on very tall screens or even a special monochrome version for colorless screens.

## Should we use `<picture>` and `<source>` or `srcset` and `sizes`?

It’s important to pay attention to the difference between viewport/DPR-based selection and art direction because it defines which responsive image feature we should use. `<picture>` and `<source>` should be used for art-direction while `srcset` and `sizes` is all you need for viewport/DPR-based selection.

## Why not just always use `<picture>` and `<source>`?

The problem with `<picture>` and `<source>` is that the browser *has to* follow the instructions of them and cannot optimize for certain cases. With `srcset` the browser is allowed to select any of the images, whichever it thinks fits better. Chrome for example doesn’t download a smaller version of an image if it has already a larger one in the cache. In the future a browser may decide to download smaller images of a `srcset` if the user is on a slow network.

## But what if we need both features for one image?

If you want to use art direction for an image, you can (and probably should) combine it with viewport/DPR-based selection to get the best of both worlds, but it’s very important to use them correctly.

## How do I know if my responsive image is configured correctly?

Responsive images are hard to test. Because of that I created a bookmarklet that helps you find problems with your images. It’s very easy to use: Just [add it to your browser](https://ausi.github.io/respimagelint/), go to your website and klick the bookmarklet.

If you experience problems with the bookmarklet feel free to report an issue on GitHub: [ausi/respimagelint](https://github.com/ausi/respimagelint).