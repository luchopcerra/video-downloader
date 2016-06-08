var https = require('https');
var fs = require('fs');
var cluster = require('cluster');
var numCpus = require('os').cpus().length;


var inputFolder = 'front-end-masters'

try {
	var files = fs.readdirSync(inputFolder);
} catch (e) {
	console.log(e);
}


if (cluster.isMaster) {
    for (var i = 0; i < numCpus; i++) {
				if (files.length>0) {
					var worker = cluster.fork();
	        worker.send(files.pop());
	        console.log('PID: ' + worker.process.pid);
				}
    }
    cluster.on('exit', function (worker, code, signal) {
				if (files.length>0){
					var worker = cluster.fork();
	        worker.send(files.pop());
				}
    });
} else {
	  process.on('message',(file)=>{

			try {
				fs.mkdirSync(file);
			} catch (e) {
				console.error(e);
			}



			var links = [];
			var getUrls = () => {
			  return new Promise((resolve, reject)=>{
			    fs.readFile('./' + inputFolder + '/' + file, 'utf8', (err,data) => {
			      if (err) {
			        reject(err);
			        return;
			      }
			      resolve(data.split('\n'));
			    });
			  });
			};


			var download = function (url, filename) {

			    return new Promise((resolve, reject)=>{

			        var newfile = fs.createWriteStream(filename);
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
			            response.pipe(newfile);
			            newfile.on('finish', function() {
			              newfile.close(function () {
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

			  links.reduce((chain,url,index) => chain.then(() => download(url, file + '/' + index + '.bin')),  Promise.resolve())
			  //.reduce((pv,cv) => pv.then(() => cv))
			  .then(() => {
			      console.log('done!');
						worker.kill();
			  });
			});
		});
}
