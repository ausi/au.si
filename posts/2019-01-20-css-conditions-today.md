# CSS Conditions Today

Reiterating on my [idea for CSS conditions](https://au.si/css-conditions-cq-alternative)
I found a new way for creating such conditions using existing CSS features.
You probably know Roman Komarov’s article [“Conditions for CSS Variables”](https://www.kizu.ru/conditions-for-css-variables/)
where he describes how you can create binary conditions
for properties that support `calc()`.
This was a great inspiration and together with a CSS trick
I learned from Lea Verou called [“Static Interpolation”](https://youtu.be/eVnUDTtOLE0?t=1167)
I was able to create CSS conditions that are similar to media queries
and support (nearly) all CSS properties.


## Binary Conditions

First, lets take look at an example of a binary condition:

```css
:root {
	--is-fancy: 0;
}
.is-fancy {
	--is-fancy: 1;
}
.component {
	font-family: Arial;
	animation: 1s component-is-fancy paused;
	animation-delay: calc((1 - var(--is-fancy)) * 1s);
}
@keyframes component-is-fancy {
	from {
		font-family: Comic Sans MS;
	}
}
```

Here every `.component` that is somewhere inside an `.is-fancy` element
gets a different font-family applied.
This works because if `--is-fancy` is `0`
the animation delay gets set to `1s`
and no animation will be applied,
but if the variable is set to `1`
the delay gets set to `0s`
and therefore the animation takes effect.
By using the `paused` play state the animation will never actually animate.
This technique can be applied to all properties
that can be used inside a `@keyframes` animation
(which seems to differ between browsers).

## Media Query Like Conditions

Now, lets say we have a `--width` variable
that tells our component how much space is available.
We could then create conditions
that work like `(min-width)` media queries:

```css
.component {
	animation: 10000s step-end component paused;
	animation-delay: calc((0 - var(--width)) * 1s);
}
@keyframes component {
	/* (min-width: 400px) */ 4% {
		font-size: 20px;
	}
	/* (min-width: 650px) */ 6.5% {
		text-align: center;
	}
}
```

Here we use a negative delay between `0s` and `-10000s`
to control at which point in the animation we want to start.
One second is corresponding to one pixel in this case,
so the `4%` step in the animation gets applied
only if `--width` is `400` or greater.

## Did we just invent Container Queries in plain CSS?

Well, sort of.
The big thing that’s missing for calling it a container query
is where the value for `--width` should come from.
One way would be to start at the `html` element with `--width: 100vw;`
and let every layout element update the value for its children.
Like `--width: calc(parent-var(--width) / 2);` for a `50%` container.
But since we need a unit-less number for our animation delay
and `calc(100vw / 1px)` is invalid in CSS
we have to use a bunch of media queries
that set the initial value of `--width` for us:

```css
@media (width: 1px) { :root { --width: 1; } }
@media (width: 2px) { :root { --width: 2; } }
@media (width: 3px) { :root { --width: 3; } }
/* … and thousands more … */
```

Sadly `parent-var()` isn’t a thing yet in CSS,
so layout elements would need an extra `<div>`
to achieve the same functionality:

```html
<div class="layout-element">
	<div class="inherit-vars">
		…
	</div>
</div>
```

```css
.layout-element {
	width: 50%;
	--set-width: calc(var(--width) / 2);
}
.inherit-vars {
	--width: var(--set-width);
}
```

You can take a look at the following example
that shows how this works for a simple component
that is styled based on the context it was placed in:
[codepen.io/ausi/pen/rPBNwJ](https://codepen.io/ausi/pen/rPBNwJ/left/?editors=0100)  
More ideas on how to use CSS conditions as container queries
can be found in [my previous article](https://au.si/css-conditions-cq-alternative).

## Should we use this in production?

I would say it depends.
Using thousands of media queries to set a CSS variable
is probably one of the parts that shouldn’t go in production.
But depending on the project
there might be simpler ways to set the `--width` variable.
Another caveat to be aware of is that the properties
that can be used inside `@keyframes`
seem to vary a lot between browsers.

## Why isn’t this a native feature of CSS yet?

I [proposed a native variation](https://discourse.wicg.io/t/css-conditions-with-variables/2048)
of this about two years ago to the WICG but it didn’t get much traction.
Maybe this technique of “faking” CSS conditions
can finally push the topic forward
as it shows that browsers are already able to handle them.
If you like it, please spread the word
so that browser vendors can become aware of
how great CSS conditions would be for us web developers.
