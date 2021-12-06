const yargs = require('yargs')
const path = require('path')
const stat = require('fs')
const fs = require('fs')
const util = require('util')
const {readdir, rmdir, unlink, copyFile, mkdir} = require("fs");

const read = util.promisify(fs.readdir)
const pstat = util.promisify(stat.stat)
const prmdir = util.promisify(fs.rmdir)
const punlink = util.promisify(fs.unlink);
const pcopyFile = util.promisify(fs.copyFile);

let counter = 0

class Observer {
    constructor(cb) {
        this.observers = new Proxy([], {
            set(target, prop, value) {
                target[prop] = value

                if (target.length === 0) {
                    cb()
                }

                return true
            }
        })
    }

    add(observer) {
        this.observers.push(observer)
    }

    remove(observer) {
        const index = this.observers.findIndex(obs => obs === observer)

        this.observers.splice(index, 1)
    }
}

// const observer = new Observer(() => {
//     deleteFolder(folder)
//     console.log('done')
// })
function deleteFolder(folder) {
    (function recursive(src) {
        if (src === path.resolve(folder, '../')) return console.log('delete done!')

        readdir(src, (err, files) => {
            if (err) return

            if (!files.length) {
                rmdir(src, (err) => {
                    if (err) return

                    recursive(path.resolve(src, '../'))
                })
            }

            files.forEach((file) => {
                const currentPath = path.resolve(src, file)

                stat(currentPath, (err, stats) => {
                    if (err) return

                    if (stats.isFile()) {
                        unlink(currentPath, (err) => {
                            if (err) return

                            recursive(src)
                        })
                    } else {
                        recursive(currentPath)
                    }
                })
            })
        })
    })(folder)
}

function readdirSync(src) {
    return new Promise((resolve, reject) => {
        readdir(src, (err, files) =>{
            if (err) reject(err)

            resolve(files)
        })
    })
}

function statSync(src) {
    return new Promise((resolve, reject) => {
        stat.stat(src, (err, stats) => {
            if (err) reject(err)

            resolve(stats)
        })
    })
}

function mkdirSync(src) {
    return new Promise((resolve, reject) => {
        createDir(src, (err) => {
            if (err) reject(err)

            resolve()
        })
    })
}

function copyFileSync(from, to) {
    return new Promise((resolve, reject) => {
        copyFile(from, to, (err) => {
            if (err) reject(err)

            resolve()
        })
    })
}

function createDir(path, cb) {
    mkdir(path, (err) => {
        if (err && err.code !== 'EEXIST') {
            return cb(err, false)
        }

        cb(null, true)
    })
}


const args = yargs
    .usage('Использование: node $0 [опции]')
    .help('help')
    .alias('help', 'h')
    .version('1.0.0')
    .alias('version', 'v')
    .example('node $0 --entry ./path --dist ./path -D')
    .option('entry', {
        alias: 'e',
        describe: 'Указывает путь к исходной директории',
        default:'./files',
    })
    .option('dist', {
        alias: 'd',
        describe: 'Указывает путь к итоговой директории',
        default: './dist'
    })
    .option('delete', {
        alias: 'D',
        describe: 'Удалить ли папку ?',
        default: false,
        boolean: true
    })
    .epilog('Homework 1')
    .argv

const config = {
    entry: path.resolve(__dirname, args.entry),
    dist: path.resolve(__dirname, args.dist),
    delete: args.delete
}

const promise = []

async function reader(src) {
    let files = await read(src)
    // fs.readdir(src, function(err, files) {
    //     if (err) throw err
    if (!files.length) throw new Error('нет файлов!')


    for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const currentPath = path.resolve(src, file)
        let stats = await statSync(currentPath)
        if (stats.isDirectory()) reader(currentPath)
        else {
            distDir = path.resolve(config.dist, file[0].toUpperCase())
            //создаем директорию с именем по первой букве файла
            if (!fs.existsSync(distDir)) {
                fs.mkdirSync(distDir);
            }
            //копируем файл в папку по первой букве
            let err = pcopyFile(currentPath, path.resolve(distDir, file));
            if (err) throw err;
            if (config.delete) {
                let err = punlink(currentPath);
                if (err) {
                    console.log(err);
                    return;
                }
            }
        }
    }
}

(async () => {
    try {
        //создаем итоговую директорию если нужно
        if (!fs.existsSync(config.dist)) {
            fs.mkdirSync('./dist');
        }
        //рекурсивно работаем с папкой
        await reader(config.entry)
        console.log('done!')
        //если указана опция D удаляем исходную папку
        if(config.delete) {
            let err = prmdir(path.resolve(__dirname, args.entry));
            if (err) console.log(err);
        }

    } catch (error) {
        console.log(error)
    }
})()