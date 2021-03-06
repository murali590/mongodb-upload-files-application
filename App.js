const express=require('express');
const path=require('path');
const crypto=require('crypto');
const mongoose=require('mongoose');
const multer=require('multer');
const GridFsStorage=require('multer-gridfs-storage');
const Grid=require('gridfs-stream');
const methodOverride=require('method-override');
const bodyParser=require('body-parser');




const app=express();

//Middleware
app.use(bodyParser.json());
app.use(methodOverride('_method'));

app.set('view engine','ejs');


//Mondo URI
const mongouri='mongodb://localhost:27017/mongoupload';
//create mongo connection
const conn=mongoose.createConnection(mongouri,{ useNewUrlParser: true } );

//Init gfs
let gfs;

conn.once('open',()=>{
	//Init stream 
	gfs=Grid(conn.db,mongoose.mongo);
	gfs.collection('uploads');
})


//create  storage engine
const storage = new GridFsStorage({
  url: mongouri,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = buf.toString('hex') + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: 'uploads'
        };
        resolve(fileInfo);
      });
    });
  }
});
const upload = multer({ storage });

//@route Get/
//@desc Loads form
app.get('/',(req,res)=>{
	//res.render('index');
	gfs.files.find().toArray((err,files)=>{
		//check if files
		if(!files||files.length === 0){
			res.render('index',{files: false});
		}else{
		//files exist
		files.map(file =>{
            if(file.contentType ===	"video/mp4"){
			file.isvideo= true;
		}else{
			file.isvideo=false
		}
		});
		res.render('index',{files: files});
	}

	})
})


//@route Post /upload
//@desc uploads file to DB
app.post('/upload',upload.single('file'),(req,res)=>{
	//res.json({file: req.file});
	res.redirect('/');
});

//@route get /files
//@desc display all files in Json
app.get('/files',(req,res)=>{
	gfs.files.find().toArray((err,files)=>{
		//check if files
		if(!files||files.length === 0){
			return res.status(404).json({
				err:'no files exist'
			});
		}
		//files exist
		return res.json(files);
	})
})

//@route get /files/:filename
//@desc display single file in Json
app.get('/files/:filename',(req,res)=>{
	gfs.files.findOne({filename: req.params.filename},(err,file)=>{
		//check if files
		if(!file||file.length === 0){
			return res.status(404).json({
				err:'no file  exist'
			});
		}
		//files exist
		return res.json(file);
	})
})


//@route get /video/:filename
//@desc display single video file
app.get('/video/:filename',(req,res)=>{
	gfs.files.findOne({filename: req.params.filename},(err,file)=>{
		//check if files
		if(!file||file.length === 0){
			return res.status(404).json({
				err:'no file  exist'
			});
		}
		//check if video
		if(file.contentType ===	"video/mp4"){
			//read output to browser
			const readstream=gfs.createReadStream(file.filename);
			readstream.pipe(res)
		}else{
			res.status(404).json({
				err:'not an vedio'
			})
		}
	})
})

//@route Delete /files/id
//@desc delete file
app.delete('/files/:id',(req,res)=>{
	gfs.remove({_id: req.params.id,root:'uploads'},(err,gridstorage)=>{
		if(err){
			return res.status(404).json({err: err});
		}
		res.redirect('/');
	})
})



const port=5001;

app.listen(port,()=>console.log(`server started on port ${port}`));





























