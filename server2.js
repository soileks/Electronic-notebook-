//Функция обратного вызова (callback function) в JavaScript - это функция, которая передается в качестве аргумента в другую функцию
 //и будет вызвана по завершении выполнения этой функции. Основная идея функций обратного вызова заключается в том, 
 //чтобы предоставить возможность выполнения определенного действия после завершения другой операции, без блокирования выполнения кода.

express = require("express");
const app = express();
const connection = require("./db2");
const bodyParser = require("body-parser"); // автоматический разбор тела или запроса (входит в express)
const multer = require("multer");
// Он используется для обработки файлов, загружаемых через форму на сервере.
//  Multer позволяет легко загружать файлы, устанавливать ограничения на их размер, определять местоположение для сохранения файлов и т.д. 
// Таким образом, он помогает упростить процесс загрузки файлов на сервере при разработке веб-приложений на Node.js.

// use использует какой-то модуль
app.use(bodyParser.urlencoded({ extended: true })); // для обработки данных, отправленных с помощью application/x-www-form-urlencoded. 
// При установке параметра extended в true, обьекты, которые к нам приезжают, формируются именно в виде обьектов

app.use(bodyParser.json()); // для обработки данных, отправленных в формате JSON.
//  Когда приложение получает запрос, оно будет использовать библиотеку bodyParser для разбора JSON-данных из тела запроса и представления их в виде JavaScript-объектов, которые могут быть использованы в коде приложения.

app.use(express.static('public4')); // все файлы в этой директории будут доступны через HTTP. (работа со статическим содержимым)

app.use(express.static('upload')); // все файлы в этой директории будут доступны через HTTP. 

app.set('view engine', 'ejs');// регистрация движка

//для директории загрузки и имени файла
const uploadDirectory = './upload/';

// Функция для определения имени файла
//Функция FileName определяет имя файла, которое будет использоваться при сохранении.
 //В данном случае, она просто использует оригинальное имя файла.
const FileName = (req, file, callback) => {

    callback(null, file.originalname);//null это ошибка, (в случае ошибки, она будет вместо null)

};

// Функция для определения пути сохранения файла
const destinationPath = (req, file, callback) => { // Стрелочная функция - это сокращенный синтаксис для написания функций в JavaScript. 
    // Она используется для определения анонимных функций и обычно состоит из ключевого слова "const" или "let", затем имени функции (необязательно), знака "=>", и тела функции.

    callback(null, uploadDirectory);

};

// Настройки для multer(сохранение файлов)
const fileStorage = multer.diskStorage({
    destination: destinationPath,
    filename: FileName
});


var upload = multer({ storage: fileStorage });// используем настройки fileStorage для обработки загрузки файлов

function handleError(res, error, errorPage) {//res представляет объект ответа (response) веб-сервера, который используется для отправки данных клиенту.
    console.error(error);

    console.log("going to the error page");
    // отправка файла в ответ на запрос
    res.sendFile(__dirname + errorPage); //__dirname в Node.js представляет собой имя каталога текущего исполняемого скрипта.
}

// function handleDone(DonePage) {

//     console.log("The data was successfully received");

//     console.log("going to the done page");

//     res.sendFile(__dirname + DonePage);
// }


async function upload_files(req, res) {
    //  Ключевое слово await используется для приостановки выполнения функции до тех пор, пока промис
    //   не будет разрешен или отклонен. 
    // Это позволяет избежать использования обратных вызовов

    try {
        
        console.log(req.body); //тело запроса содержит данные отправленные с клиента

        var note = req.body.note || ''; // кавычки для избегания undefined 
        let Ws = " ";

        var chips = Ws + req.body.chips || '';

        var note_text = req.body.note_text || '';

        //trim удаляет начальные и конечные пробелы в строке. Проверяется на пустые поля
        //req.files это массив файлов, отправленные пользователем
        // если хотя бы одно поле не пустое, то ошибки нет
        
        if (!(note.trim() || chips.trim() || note_text.trim() || (req.files && req.files.length > 0))) {
            throw new Error("At least one field should be filled");
        }

        console.log(req.files);
        //map преобразует каждый файл в его имя, join для обьединения файлов в строку через запятые
        var file_dir = (req.files || []).map(file => file.filename).join(', ');

        // Выполнение запроса к базе данных с помощью await
        // без использования промисов и асинхронности, выполнение запроса к бд могло бы задержать выполнение остальной части кода 
        // а так код ждет завершения запроса без блокировки остальной части программы(остальной код выполняется) за счет механизма event loop
        // в аргументы промис помещена анонимная функция обратного вызова, которая принимает 2 параметра
        const result = await new Promise((resolve, reject) => {
            connection.query('insert into notes ( note, chips, note_text, file_dir ) values ( ?, ?, ?, ? )',
                [note, chips, note_text, file_dir],
                function(err, result) {
                    if (err) {
                        reject(err);           //Это стрелочная функция используется для создания обработчика для Promise в JavaScript. 
                        //В данном случае, она передается в качестве аргумента для конструктора Promise и содержит код, который выполняется при вызове resolve или reject.

                    } else {

                        resolve(result);
                    }
                    
                });
        });

   // handleDone("/public4/done.html");
   console.log("The data was successfully received");

    console.log("going to the done page");

    res.sendFile(__dirname + "/public4/done.html");

    } catch (err) {

        handleError(res, err, "/public4/ErrorPage.html");

    }
}

// создание обработчика маршрута для запроса
app.post("/CreateEndpoint", upload.array("file_dir"), upload_files);// /CreateEndpoint - это путь, по которому будет обрабатываться POST-запрос.
// upload.array("filedir") - это middleware, используемый для обработки загруженных файлов с именем "filedir".

function Render(res, result){

    console.log(JSON.stringify(result)); // выводит результат в формате json (превратили обьект в строку)

    res.render('result', {find: result}); // вывод шаблона представления(имя шаблона, данные в шаблон)
}

async function find_note(req, res)
{
    try {
        // Проверка на пустое поле записи
        if (!req.body.note.trim()) {
            throw new Error("Empty note field");
        }

        var note = '%' + req.body.note + '%'; // % для оператора like для поиска подстроки в строке
        
        const result = await new Promise((resolve, reject) => {
            connection.query('select * from notes where note like ?', 
            [note], 
            function(err, result) {
                if (err) {
                    reject(err);

                } else {

                    resolve(result);
                }
            });
        });
        
        Render(res, result);

        }
        catch (err) {

            handleError(res, err, "/public4/ErrorPage.html");
    
        }
}

app.post("/find_note", find_note);//  при POST-запросе на путь "/find_note" будет вызван обработчик find_noter.

async function find_chips(req, res) {

    try {
        // Проверка на пустое поле записи
        if (!req.body.chips.trim()) {
            throw new Error("Empty note field");
        }
        
       var chips = '%' + req.body.chips + '%';

        console.log(chips);
        const result = await new Promise((resolve, reject) => {
            connection.query('select * from notes where chips like ?',
             [chips],
            function(err, result) {
                if (err) {
                    reject(err);

                } else {
                    resolve(result);

                }

            });
        });

        Render(res, result);
           
    }
    catch (err) {

        handleError(res, err, "/public4/ErrorPage.html");

    }
   
}

app.post("/find_chips", find_chips);

async function find_note_text(req, res) {

    try {
        // Проверка на пустое поле записи
        if (!req.body.note_text.trim()) {
            throw new Error("Empty note field");
        }

        var note_text = '%' + req.body.note_text + '%';
        
        console.log(note_text);

        const result = await new Promise((resolve, reject) => {
            connection.query('select * from notes where note_text like ?', 
            [note_text], 
            function(err, result) {
                if (err) {

                    reject(err);

                } else {

                    resolve(result);
                }

            });

        });

        Render(res, result);
            
    }
    catch (err) {

        handleError(res, err, "/public4/ErrorPage.html");

    }
   
}

app.post("/find_note_text", find_note_text);

console.log("port 3000");
app.listen(3000);

