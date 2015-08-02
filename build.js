var fs = require('fs');
var path = require('path');
var sass = require('node-sass');
var autoprefixer = require('autoprefixer-core');
var postcss = require('postcss');
var cssnano = require('cssnano');
var uncss = require('uncss');
var marked = require('marked');
var mustache = require('mustache');

var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

var markdownConfig = {
	gfm: true,
	tables: true,
	breaks: true,
	sanitize: true,
};

var templates = {};

fs.readdirSync(path.join(__dirname, 'templates')).forEach(function(file) {
	templates[file.split('.')[0]] = fs.readFileSync(path.join(__dirname, 'templates', file), 'utf-8');
});

var styles = sass.renderSync({
	file: path.join(__dirname, 'styles.sass'),
	outputStyle: 'compressed',
}).css.toString();

var posts = [];

fs.readdirSync(path.join(__dirname, 'posts')).sort().reverse().forEach(function(file) {
	var markdown = fs.readFileSync(path.join(__dirname, 'posts', file), 'utf-8');
	var intro = marked(markdown.split('\n\n\n')[0].substr(markdown.indexOf('\n')).trim(), markdownConfig);
	var content = marked(markdown.substr(markdown.indexOf('\n\n\n')).trim(), markdownConfig);
	var date = new Date(file.substr(0, 10));
	var data = {
		date: {
			day: date.getDate(),
			month: months[date.getMonth()],
			year: date.getFullYear(),
			iso: date.toISOString().substr(0, 10),
		},
		key: file.substr(11).split('.')[0],
		title: stripTags(marked(markdown.substr(2, markdown.indexOf('\n') - 2), markdownConfig)),
		description: stripTags(intro),
		intro: intro,
		content: content,
	};
	posts.push(data);
});

if (!fs.existsSync(path.join(__dirname, 'dist'))) {
	fs.mkdirSync(path.join(__dirname, 'dist'));
}

fs.readdirSync(path.join(__dirname, 'dist')).forEach(function(file) {
	if (file.substr(-5) === '.html') {
		fs.unlinkSync(path.join(__dirname, 'dist', file));
	}
});

var pagesQueue = [];

posts.forEach(function(post) {
	pagesQueue.push({
		key: post.key,
		template: templates.post,
		data: post,
	});
});

pagesQueue.push({
	key: 'index',
	template: templates.index,
	data: {
		title: 'au.si',
		key: '',
		posts: posts,
	},
});

buildPages();

function buildPages() {
	if (!pagesQueue.length) {
		return;
	}
	var page = pagesQueue.shift();
	buildPage(page.key, page.template, page.data, function() {
		buildPages();
	});
}

function buildPage(key, template, data, callback) {
	console.log(key + '.html');
	uncss(
		mustache.render(template, data, templates),
		{ raw: styles },
		function (error, newStyles) {
			if (error) {
				console.error(error);
				process.exit(1);
			}
			data.styles = postcss([autoprefixer, cssnano()]).process(newStyles).css;
			fs.writeFileSync(
				path.join(__dirname, 'dist', key + '.html'),
				minifyHtml(mustache.render(template, data, templates))
			);
			callback();
		}
	);
}

function stripTags(html) {
	return html
		.replace(/<[^>]+>/gi, '')
		.replace(/&#39;/gi, '\'')
		.replace(/&quot;/gi, '"')
		.replace(/&lt;/gi, '<')
		.replace(/&gt;/gi, '>')
		.replace(/&amp;/gi, '&')
		.replace(/\s+/gi, ' ')
		.trim();
}

function minifyHtml(html) {
	return html.replace(/(<pre[^>]*>.*?<\/pre>)|(\n)\s+/gi, function(match, pre, lineBreak) {
		return pre || lineBreak;
	});
}
