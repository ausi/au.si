# CSS Container Queries

In a [discussion on GitHub](https://github.com/ResponsiveImagesCG/container-queries/issues/2#issuecomment-121281825) I came up with the idea of a slightly different syntax and function for container queries which I want to explain in more detail here. Container Queries are a concept described by [Mat Marquis](http://alistapart.com/author/matmarquis) on [A List Apart](http://alistapart.com/article/container-queries-once-more-unto-the-breach) as an evolution of element queries. If you want to know more about container queries in general, take a look at the [RICG](http://ricg.io/) repositories on GitHub: [container-queries](https://github.com/ResponsiveImagesCG/container-queries), [cq-demos](https://github.com/ResponsiveImagesCG/cq-demos) and [cq-usecases](https://github.com/ResponsiveImagesCG/cq-usecases).


## The Recursion Issue

The main problem with container queries is recursion or circularity, think of the following example:

```css
.container { float: left; }
.child { width: 200px; }
.container:media(min-width: 150px) .child { width: 100px; }
```

The width of the container depends on the width of its descendants and because of that, the CSS above cannot be handled correctly. The second rule sets the width of the child to 200 and therefore the third rule would match, this would set the width to 100 and the third rule wouldn’t match anymore which sets it back to 200 and so on.

## Browser Implementation Problems

Another problem is how browsers work with CSS. They mainly go through three steps: compute style, layout and paint. In the first step all style rules are matched against all elements on the page to get the CSS properties for each of them. In the second step the dimensions and positions of all elements are calculated and in the final step everything gets painted on the screen.

The problem is that for container queries we need to know the size of an element – which is calculated in step 2 – to know which rules should match in step 1. Going back and forth between compute style and layout and detecting recursions in this process may be very complex and bad for performance.

## Solutions?

[Tab Atkins](http://www.xanthir.com/) wrote about a possible solution in [this article](http://www.xanthir.com/b4VG0), describing a concept of “viewport elements” which work similar to iframes. If I understand it correctly, it would mean that width and height have to be fixed which wouldn’t be great for most use cases. Fixed width and dynamic height are what most use cases are about I think.

## Different Syntax

With container queries working a bit different than the current proposal, it might be possible to solve the issues. I thought of the following syntax:

```css
.child:container(min-width: 150px) { width: 100px; }
```

Instead of telling the browser which element we want as the container for our query, we add the container query next to the element we want to style different and let the browser decide what the “right” container is. The browser can then traverse the DOM tree up and select the first qualified element as the container.

This could work so: First traverse the DOM up until an element with a fixed width is found, e.g. a pixel value as width or if none is found take the document itself. Then go the DOM from the found element back down as long as the elements depend on the width of the parent e.g. a block element with width auto or a percentage width. Take that element as the container to match the query against.

The recursion example from above would look like this:

```css
.container { float: left; }
.child { width: 200px; }
.child:container(min-width: 150px) { width: 100px; }
```

But this time there would be no recursion, because the browser wouldn’t select `.container` as the container for the query but the parent of `.container` for example. This wouldn’t only solve the recursion issue but also make more sense for CSS authors who might think of the third rule in the example as like saying *“If the child has at least 150 pixel space available horizontally”*.

## Possible Browser Implementation

It would still require that the browser knows the dimensions of the elements while computing the styles, but I think this should be possible without triggering the whole layout process.

If I’m right the browser computes the styles by traversing the DOM tree from top to bottom. In this process it could already calculate and store the width if it knows that it doesn’t depend on its descendants. If it then reaches an element with a container query rule it already knows what the right container is – it’s the nearest ancestor for which it was able to calculate a width – and which width it has.

It may be that I’m totally wrong with my assumptions about browser internals, but it would be great if it is implementable this way.

## Prolyfill

To test my idea I created a prolyfill for my version of container queries, you can find it at [ausi/cq-prolyfill](https://github.com/ausi/cq-prolyfill) on GitHub. Feel free to play around with it.

## Further ideas

I wrote here mainly about querying the width and the prolyfill currently only supports width and height. But with my imaginary browser implementation in mind it should be easy to extend container queries to nearly all CSS properties. For example querying the font size or the background color could be helpful to create encapsulated components that look good everywhere. The syntax could be changed to reflect that better like `:container(width > 149px)` or `:container(font-size < 10px)`. And most likely there is a better name for the `:container(` part.

Follow-up: [CSS Container / Element Queries Update](/css-container-element-queries).
