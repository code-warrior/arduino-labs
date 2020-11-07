const { src, dest, series, watch } = require(`gulp`);
const del = require(`del`);
const HTMLPreprocessor = require(`gulp-nunjucks-render`);
const HTMLCompressor = require(`gulp-htmlmin`);
const CSSCompiler = require(`gulp-sass`);
const browserSync = require(`browser-sync`);
const data = require(`gulp-data`);
const fs = require(`fs`);
const reload = browserSync.reload;

let compileCSSForDev = () => {
    return src([
        `./app/sass/*.scss`,
        `./app/sass/**/*.scss`])
        .pipe(CSSCompiler({
            outputStyle: `expanded`,
            precision: 10
        }).on(`error`, CSSCompiler.logError))
        .pipe(dest(`./.temp/css`));
};

let compileCSSForProd = () => {
    return src([
        `./app/sass/*.scss`,
        `./app/sass/**/*.scss`])
        .pipe(CSSCompiler({
            outputStyle: `compressed`,
            precision: 10
        }).on(`error`, CSSCompiler.logError))
        .pipe(dest(`./production-website/css`));
};

let compileHTMLForDev = () => {
    HTMLPreprocessor.nunjucks.configure({watch: false});

    return src([
        `./app/views/*.html`,
        `./app/views/**/*.html`])
        .pipe(data(function () {
            return JSON.parse(fs.readFileSync(`./app/models/links.json`));
        }))
        .pipe(data(function () {
            return JSON.parse(fs.readFileSync(`./app/models/sections.json`));
        }))
        .pipe(HTMLPreprocessor())
        .pipe(dest(`./.temp`));
};

let compileHTMLForProd = () => {
    HTMLPreprocessor.nunjucks.configure({watch: false});

    return src([
        `./app/views/*.html`,
        `./app/views/**/*.html`,
        `./app/views/**/`])
        .pipe(data(function () {
            return require(`./app/models/links.json`);
        }))
        .pipe(data(function () {
            return require(`./app/models/sections.json`);
        }))
        .pipe(HTMLPreprocessor())
        .pipe(dest(`./production-website`));
};

let compressHTML = () => {
    return src(`./production-website`)
        .pipe(HTMLCompressor({
            removeComments: true,
            collapseWhitespace: true
        }))
        .pipe(dest(`./production-website`));
};

let copyImagesToProdFolder = () => {
    return src([
        `./app/views/img/*.*`],
        {dot: true})
        .pipe(dest(`./production-website/img/`));
};

let serve = () => {
    browserSync({
        reloadDelay: 250,
        notify: true,
        server: {
            baseDir: [`./.temp/`, `./app/`, `./app/views/`]
        }
    });

    watch([
        `./app/views/**/*.html`,
        `./app/views/*.html`,
        `./app/controllers/**/*.njk`,
        `./app/controllers/*.njk`,
        `./app/sass/**/*.scss`,
        `./app/sass/*.scss`,
        `./app/models/*.json`
    ], series(`compileHTMLForDev`, `compileCSSForDev`))
    .on(`change`, reload);
};

async function clean () {
    let fs = require(`fs`),
        i,
        foldersToDelete = [`./.temp/`, `./production-website/`];

    for (i = 0; i < foldersToDelete.length; i++) {
        try {
            fs.accessSync(foldersToDelete[i], fs.F_OK);
            process.stdout.write(`\n\tThe ` + foldersToDelete[i] +
                ` directory was found and will be deleted.\n`);
            del(foldersToDelete[i]);
        } catch (e) {
            process.stdout.write(`\n\tThe ` + foldersToDelete[i] +
                ` directory does NOT exist or is NOT accessible.\n`);
        }
    }

    process.stdout.write(`\n`);
}

exports.compileCSSForDev = compileCSSForDev;
exports.compileCSSForProd = compileCSSForProd;
exports.compileHTMLForDev = compileHTMLForDev;
exports.compileHTMLForProd = compileHTMLForProd;
exports.compressHTML = compressHTML;
exports.copyUnprocessedAssetsToProdFolder = copyImagesToProdFolder;
exports.build = series(compileHTMLForProd, compileCSSForProd, copyImagesToProdFolder);
exports.default = series(compileHTMLForDev, compileCSSForDev, serve);
exports.clean = clean;
