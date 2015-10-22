# CSS Container / Element Queries Update

Two months ago I posted about [a proposal for container queries](/css-container-queries) (aka element queries). This article is about an update to the syntax and an in-depth explanation of the intended browser implementation.


## New syntax

The [prolyfill](https://github.com/ausi/cq-prolyfill) is now available in version [0.2.0](https://github.com/ausi/cq-prolyfill/releases/tag/v0.2.0) and with this update the syntax changed a little bit. Instead of `:container(min-width: 150px)` it’s now `:container(width > 149px)`. The great benefit from this syntax change is that now every CSS property can be queried, e.g. `:container(font-size < 10px)` or `:container(text-align = right)`. The prolyfill now fully supports container queries for all CSS properties, you can take a look at the demo here: <https://ausi.github.io/cq-prolyfill/demo/>. Container queries can now be used like so:

```css
.element:container(width >= 100px) {
	/* If it’s container is at least 100px wide */
}
.element:container(height > 100px < 200px) {
	/* If it’s container is between 100px and 200px high */
}
.element:container(text-align = right) {
	/* If it’s container has a right text-align */
}
```

## Ready to use

With the new version, the prolyfill is now unit tested and pretty stable (thanks to BrowserStack for sponsoring their great [automated cross browser testing](https://www.browserstack.com/automate)). Feel free to use it in your next project. If you find any issues please [file a bug on GitHub](https://github.com/ausi/cq-prolyfill/issues).

## Browser Implementation

I wrote about a browser implementation in [my previous article](/css-container-queries#possible-browser-implementation) and want to explain it in more detail here. The basic idea is to do some layout calculations already in the compute style step of the rendering engine.

Let’s take the following example HTML:

```html
<html>
	<body>
		<div class="level-1">
			<div class="level-2">
				<div class="level-3"></div>
			</div>
		</div>
	</body>
</html>
```

With this CSS:

```css
.level-1 {
    padding: 10px;
}
.level-2 {
    float: left;
}
.level-3:container(width > 150px) {
    background: green;
}
```

And lets assume a viewport of 800x600.

In the compute style step the browser would do the following:

1. Starting with the viewport as a kind of a root node and store the viewport width as the container width for this node. The root node has `container-width = 800` stored now.

2. Start traversing the DOM tree

3. Matching the element `html` against style rules which results in
	```css
	{ display: block; width: auto }
	```
	With this computed style we know that this element doesn’t depend on its descendants and we can inherit the container width from the parent node. So we store `container-width = 800` for the `html` node. Same for `body`.

4. Matching the element `div.level-1` against style rules resulting
	```css
	{ display: block; width: auto; padding: 10px }
	```
	With this computed style we know that this element doesn’t depend on its descendants and we can again inherit the container width from the parent node. This time there is also a padding on the element, which we have to taken into account. So we store `container-width = 780` for the `.level-1` node.

5. Matching the element `div.level-2` against style rules resulting
	```css
	{ display: block; width: auto; float: left }
	```
	Now we have an element whose width does depend on its descendants so we have to store something like `container-width = not-applicable`.

6. Matching the element `div.level-3` against style rules and hitting a rule with a container query in it. To determine if this rule matches we check the `container-width` of the parent node, which is `not-applicable`, so we go to the next parent to ask for `container-width` and get the value `780` back. Now we match `780` against `width > 150px` which matches and so the rule matches. The computed style for this element is now
	```css
	{ display: block; width: auto; background: green }
	```

7. Finished traversing the DOM tree. All styles are computed now and we can go to the layout step.

The computed style would now look like this:

```ini
[Node html]
	display = block
	width = auto
	container-width = 800

[Node body]
	display = block
	width = auto
	container-width = 800

[Node .level-1]
	display = block
	width = auto
	padding-right = 10
	padding-left = 10
	container-width = 780

[Node .level-2]
	display = block
	width = auto
	float = left
	container-width = not-applicable

[Node .level-3]
	display = block
	width = auto
	background = green
	container-width = not-applicable
```

## Further details

Take a look at the discussion on GitHub [RICG/container-queries#3](https://github.com/ResponsiveImagesCG/container-queries/issues/3) or try out the prolyfill [ausi/cq-prolyfill](https://github.com/ausi/cq-prolyfill).
