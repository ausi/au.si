var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var sass = require('node-sass');
var autoprefixer = require('autoprefixer');
var postcss = require('postcss');
var cssnano = require('cssnano');
var uncss = require('uncss');
var marked = require('marked');
var mustache = require('mustache');
var request = require('request');
var lwip = require('lwip');
var prism = require('prismjs');
require('prismjs/components/prism-ini');

var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

var markdownConfig = {
	gfm: true,
	tables: true,
	breaks: true,
	sanitize: true,
	highlight: function (code, lang) {
		if (lang && prism.languages[lang]) {
			return prism.highlight(code, prism.languages[lang], lang);
		}
	},
};

var templates = {};

fs.readdirSync(path.join(__dirname, 'templates')).forEach(function(file) {
	templates[file.split('.')[0]] = fs.readFileSync(path.join(__dirname, 'templates', file), 'utf-8');
});

var styles = sass.renderSync({
	file: path.join(__dirname, 'styles.sass'),
	outputStyle: 'compressed',
}).css.toString();

styles += fs.readFileSync(path.join(__dirname, 'node_modules', 'prismjs', 'themes', 'prism-okaidia.css'), 'utf-8');

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
buildImages(function(images) {
	if (!fs.existsSync(path.join(__dirname, 'dist', 'images'))) {
		fs.mkdirSync(path.join(__dirname, 'dist', 'images'));
	}
	images.forEach(function(image) {
		fs.writeFileSync(path.join(__dirname, 'dist', 'images', image.split('/').pop()), fs.readFileSync(image));
	});
});

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
			postcss([autoprefixer, cssnano()]).process(newStyles).then(function(css) {
				data.styles = css;
				fs.writeFileSync(
					path.join(__dirname, 'dist', key + '.html'),
					minifyHtml(mustache.render(template, data, templates))
				);
				callback();
			});
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
	return html.replace(/(<pre[^>]*>[^]*?<\/pre>)|(\n)\s+/gi, function(match, pre, lineBreak) {
		if (pre) {
			return pre.replace(/(?:^|\n)(?: {4})+[^ ]/g, function(match) {
				return match.replace(/ {4}/g, '\t');
			});
		}
		return lineBreak;
	});
}

function buildImages(callback) {
	request({
		url: 'https://www.gravatar.com/avatar/ef0606c138d944e1a8089ff8eb1df71d?s=512',
		encoding: null,
	}, function (error, response, originalImage) {
		if (error || response.statusCode !== 200) {
			console.error(error);
			console.error(response.statusCode);
			callback();
			return;
		}
		var imageHash = crypto.createHash('md5').update(originalImage).digest('hex');
		var sizes = [64, 128];
		var images = sizes.map(function(size) {
			return path.join(__dirname, 'tmp', imageHash, 'profile-' + size + '.jpg');
		});
		if (fs.existsSync(path.join(__dirname, 'tmp', imageHash))) {
			callback(images);
			return;
		}
		if (!fs.existsSync(path.join(__dirname, 'tmp'))) {
			fs.mkdirSync(path.join(__dirname, 'tmp'));
		}
		fs.mkdirSync(path.join(__dirname, 'tmp', imageHash));
		lwip.open(originalImage, 'jpg', function(err, image){
			if (err) {
				console.error(err);
				callback();
				return;
			}
			var done = 0;
			sizes.forEach(function(size) {
				image.clone(function(err, clone) {
					if (err) {
						console.error(err);
						return;
					}
					clone.batch()
						.resize(size, size)
						.writeFile(path.join(__dirname, 'tmp', imageHash, 'profile-' + size + '.jpg'), 'jpg', {quality: 85}, function(err) {
							console.log('profile-' + size + '.jpg');
							done++;
							if (done === sizes.length) {
								callback(images);
							}
						});
				});
			});
		});
	});
}
