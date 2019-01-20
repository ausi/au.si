# Self-Referencing CSS Variables

Currently it is not possible to make a custom property in CSS reference itself. But this could be useful for several cases, e.g. if you want to modify a number for every nesting level of the same element:

```css
:root {
	--border-width: 50px;
}
.component {
	border: var(--border-width) solid red;
	--border-width: calc(var(--border-width) / 2);
}
```


If self referencing would work, for every nesting level of `.component` the width of the border would be half as thick as its parent.

Luckily there is a workaround for that once native mixins via `@apply` [get into browsers](http://caniuse.com/#feat=css-apply-rule). This example does actually work the way we want:

```css
:root {
	--border-width: 50px;
}
.component {
	border: var(--border-width) solid red;
	--mixin: {
		--border-width: calc(var(--border-width) / 2);
	};
	@apply --mixin;
}
```

You can see it in action [on CodePen](http://codepen.io/anon/pen/EWyZyM). Currently you need Google Chrome with the experimental web plattform features flag enabled to see it working.

## UPDATE: Jan 2019

[CSS @apply was discarded](https://www.xanthir.com/b4o00),
partly because of some problems it has with applying mixins 
that themself include other variables.
So we have to wait until [`parent-var()`](https://lists.w3.org/Archives/Public/www-style/2012Aug/0891.html)
becomes a thing in CSS.
