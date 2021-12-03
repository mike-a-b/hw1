const yargs = require('yargs')
const path = require('path')
const readdir = stat = fs = require('fs')

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

function reader(src) {
    fs.readdir(src, function(err, files) {
        if (err) throw err 
        if (!files.length) throw new Error('нет файлов!')

        files.forEach(function(file) {
            const currentPath = path.resolve(src, file)

            stat.stat(currentPath, function(err, stats) {
                if (err) throw err
                if (stats.isDirectory()) {//директория
                    //продолжаем рекурсию
                    reader(currentPath)
                   // console.log('dir', currentPath)
                } else {//файл
                    distDir = path.resolve(config.dist, file[0])
                    //создаем директорию с именем по первой букве файла
                    if (!fs.existsSync(distDir)) {
                        fs.mkdirSync(distDir.toUpperCase());
                    }
                    //копируем файл в папку по первой букве
                    fs.copyFile(currentPath, path.resolve(distDir,file), err => {
                        if(err) throw err;
                    }) 
                    if(config.delete)
                        fs.unlink(currentPath, err => {
                            if (err) {
                                console.log(err);
                                return;
                            }  
                        })
                    //console.log(file);
                   // console.log('file', currentPath)
                }
            })
        })
    })
}

//main
try {
    //создаем итоговую директорию если нужно
    if (!fs.existsSync(config.dist)) {
        fs.mkdirSync('./dist');
    }
    //рекурсивно работаем с папкой
    reader(config.entry)
    //если указана опция D удаляем исходную папку
    if(config.delete)
        fs.rmdir(path.resolve(__dirname, args.entry), err => {
            if (err) {
              console.log(err);
              return;
            }
        })
} catch (error) {
    console.log(error)
}