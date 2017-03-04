# CSS Conditions – An Alternative To Container Queries

The concept of CSS [container queries](https://github.com/ResponsiveImagesCG/container-queries) (aka element queries) has been around for quite some time, you can read more about them in [this great article](https://ethanmarcotte.com/wrote/on-container-queries/) from Ethan Marcotte. They can be used today with JavaScript libraries like [EQCSS](http://elementqueries.com/) or my own [cq-prolyfill](https://github.com/ausi/cq-prolyfill). But from the browsers side there is not much progress on this topic. Mainly because the proposed functionality cannot be implemented without mixing style computation and layout or introducing some sort of “viewport elements”, which both seem to be impractical or bad for performance.

I think there is an easier way to achieve what web developers want, without having to mess around with browser internals or circularity issues.


## CSS Conditions

My proposal for CSS conditions is very straight forward: You have a condition and a block of declarations that get applied if the condition evaluates to true.

```css
@when (<condition>) { <list-of-declarations> }
```

This could look like so:

```css
.my-element {
	color: red;
	@when (var(--my-prop) > 200px) {
		float: left;
		width: 150px;
	};
}
```

This is a very powerful feature and can be useful for all kinds of situations I think. It should not be too hard for browsers to get this working because with [`@apply`](http://tabatkins.github.io/specs/css-apply-rule/) browsers can already add declarations based on CSS variables. An [awesome workaround](http://kizu.ru/en/fun/conditions-for-css-variables/) exists today that makes CSS conditions possible, but it’s very limited and can only be used for properties that support `calc()`.

## How does it get us closer to container queries?

Container queries are not much different to my concept of CSS conditions, the only – but big – difference is that the condition is based on the actual width of an element, not a CSS variable. So how do we get the elements width into a CSS variable? I think there are two options:

We could use a simple script that uses [ResizeObserver](https://developers.google.com/web/updates/2016/10/resizeobserver) to watch our effected elements and sets a `--element-width` variable on them. After that, it’s easy to create conditional styles based on this variable. It would be way simpler to write than current container query scripts and is also extendable to all kinds of element properties that we want to write conditional styles for, see [EQCSS](http://elementqueries.com/) to get an idea of query properties that might be useful.

The other option is to take a declarative approach by setting an `--available-width` variable in CSS and passing it down to its children. This makes it completely independent from JavaScript and the layout process. At the `:root` level we could start with `100vw`, a 50% wide element could set it to `(--available-width / 2)` and for fixed width elements we could just set it directly to `800px`. To get this working we would also need to fix [self-referencing CSS variables](https://au.si/self-referencing-css-variables). In CSS it would look like this:

```css
:root { --available-width: 100vw }
.wrapper {
	width: 800px;
	--available-width: 800px;
}
.column {
	width: 50%;
	--available-width: calc(var(--available-width) / 2);
}
.component {
	@when (var(--available-width) > 200px) {
		float: left;
	};
}
```

No matter where the `.component` would be placed on the page, its styles would react to the `available-width` variable of the parent element.

For smaller projects, using keywords instead of widths might be enough. For example `--context: wide` for the content area and `--context: narrow` for the sidebar. For smaller viewports it will then be set to `narrow` for the content area via a media query.

```css
.sidebar { --context: narrow }
.content { --context: wide }
@media (max-width: 900px) {
	.content { --context: narrow }
}
.component {
	@when (var(--context) = wide) {
		float: left;
	};
}
```

Even though this is not as convenient as the original proposals for container queries, it should be much easier to implement, doesn’t suffer from the circularity problem and is still powerful enough to solve the [RICG use-cases](https://responsiveimagescg.github.io/cq-usecases/).

## And now?

If you think this idea could work, or have any suggestions, feel free to comment on the [GitHub issue container-queries#5](https://github.com/ResponsiveImagesCG/container-queries/issues/5), talk about the [CSS conditions feature on WICG Discourse](https://discourse.wicg.io/t/css-conditions-with-variables/2048) or ping me [on Twitter](https://twitter.com/ausi).
