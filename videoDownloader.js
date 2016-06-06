var https = require('https');
var fs = require('fs');


var inputFileName = 'videos.txt'
var outputFolder = 'videos';

if (process.argv.length >= 3 && process.argv[2]){
	inputFileName = process.argv[2];
	if (process.argv.length >= 4 && process.argv[3]){
		outputFolder = process.argv[3]
	}
} else {
	console.warn('Default input fileName is '+inputFileName+ ' and it has to exist and contain videos urls');
	console.warn('default outputFolder is '+outputFolder);
	console.warn('Recommended usage: \nnode videoDownloader.js [INPUT_FILENAME] [OUTPUT_DIRNAME]');
	console.warn('For example: \nnode videoDownloader.js miCurso.txt miCurso \n');
}

try {
	fs.mkdirSync(outputFolder);
} catch (e) {
	console.error(e);
}

var links = [];
var getUrls = () => {
  return new Promise((resolve, reject)=>{
    fs.readFile(inputFileName, 'utf8', (err,data) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(data.split('\n'));
    });
  });
};

var cantVideosDownloaded = 0;
var download = function (url, filename) {
		cantVideosDownloaded++;
    return new Promise((resolve, reject)=>{

        var file = fs.createWriteStream(filename);
        let partialContent = 0;
        let fileSize;
        https.get(url, function(response){
            fileSize = response.headers[ 'content-length' ];
            response.on('data', (chunk)=>{
                partialContent+=chunk.length;
                let percentage = ((partialContent/fileSize)*100).toFixed(2);
                console.log(
                  percentage + ' % of ' + filename + ' has been downloaded.'
                );
            });
            response.pipe(file);
            file.on('finish', function() {
              file.close(function () {
                  resolve();
              });
            });
        }).on('error', function(e){
          reject(e);
        });
    });
};
getUrls().then((links) => {
  //links.map((elem, index) => download(elem, './videos/' + index + '.bin'))

  //links.reduce((pv,cv,index) => download(pv, './videos/' + index + '.bin').then(() => download(cv, './videos/' + index+1 + '.bin')));

  links.reduce((chain,url,index) => chain.then(() => download(url, './' + outputFolder + '/' + index + '.bin')),  Promise.resolve())
  //.reduce((pv,cv) => pv.then(() => cv))
  .then(() => {
      console.log('done!');
			console.log(cantVideosDownloaded' videos has been download under ' + outputFolder + ' folder');
  });
})
