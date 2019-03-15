const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')

const mongoose = require('mongoose')
mongoose.connect(process.env.MLAB_URI || 'mongodb://localhost/exercise-track',{ useNewUrlParser: true } )

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

//
/*app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});*/

app.get("/api/hello",(req,res) => {
  var fe = new Date()
  res.json({date:fe.toDateString()})
})

var Schema = mongoose.Schema;
var nomSchema = new Schema({
    nombre: String,
    id: Number
})

var Nombre = mongoose.model("Nom",nomSchema)



//Permite hacer ingreso de usuario
app.post("/api/exercise/new-user",function (req,res,next) {
  var nomabusq = req.body.username
  //res.send({nom:req.body.username})
  
  
  Nombre.findOne({nombre:nomabusq},function(error, data){
      if(data) {
        
        res.send("El nombre ingresado ya existe");
        
      } else {
               
        var num = Math.floor(Math.random() *100000)
        
        var data = new Nombre ({
          nombre:nomabusq,
          id: num
        })
        
        data.save(function(err) {
          if(err) {
           return res.send("Error al guardar en base de datos")
          }
        })
         
        return res.json(data)
      }

  })
  
});

app.get("/api/exercise/users",function(req,res){
      
  Nombre.find({},function(err,data){
      res.send(data)
  }).select("-_id").select("-__v")
    
})

var inforSchema = new Schema ({
    id: String,
    nombre: String,
    descripcion: String,
    duracion: Number,
    fecha: Date
});

  var Info = mongoose.model("Info",inforSchema)

app.post("/api/exercise/add",function(req,res){
  
  var id = req.body.userId
  var fe = req.body.date
  var de = req.body.description
  var du = req.body.duration
  
  Nombre.findOne({id:id},function(error,data){
    if(data){
      
      var fecha = new Date()
      
        var regis = new Info({
            id:id,
            nombre:data.nombre,
            descripcion: req.body.description,
            duracion: req.body.duration,
            fecha: req.body.date == "" ? fecha : new Date(fe).toDateString()
        });
      
      if (de != "" && du != "") { 
            
      //regis.markModified(regis.fecha());  
      regis.save((error) => {if(error){res.send("No se pudo grabar en base de datos") }})
            
      res.send(regis);//como hacer cruce
      
      } else {
      
        res.send("Ingrese los valores obligatorios")
        
      }
      
    } else {
      res.send("No se encontro id ingresado")
    }
  
  }).select("-_id").select("-__v")
});


app.get("/api/exercise/log",function(req,res,next){
    
  var id = req.query.userId
  var li = req.query.limit
  var fo = req.query.from
  var to = req.query.to
  
  //res.json({id:id})
  
  if (!req.query.userId) return next({
    status: 400,
    message: 'unknon userId'
  });
  
  Info.find({id:id},function(error,data){
    
    
    if(error) return next(error)
    
    if (0 === data.length) return next(res.send("No se encontró Id"))

       
    if(data){
    
      
      
        if(fo == null && to == null) {
      
            res.json({
                id:data[0].id,
               nombre:data[0].nombre,
               registros: data.length,
               log: data.map(x => x)
              /* log: [
                {descripcion:data[0].descripcion,
                duracion:data[0].duracion,
                fecha:data[0].fecha}
                ]*/
             })
           
       } else if (fo != null && to == null){
            
         res.json({
               id:data[0].id,
               nombre:data[0].nombre,
               desde: fo ? fo : null,
               hasta: to ? to : "",
               registros: req.query.li ? req.query.li : data.filter(x => new Date(x.fecha) >= new Date(fo)).length,
               log: data.filter(x => new Date(x.fecha) >= new Date(fo))
           //fecha:data[4].fecha.getYear()
         })
                          
      
        } else if (fo == null && to != null) {
        
          res.json({
               id:data[0].id,
               nombre:data[0].nombre,
               desde: fo ? fo : "",
               hasta: to ? to : null,
               registros: req.query.li ? req.query.li : data.filter(x => new Date(x.fecha) <= new Date(to)).length,
               log: data.filter(x => new Date(x.fecha) <= new Date(to))
           
         })
          
        } else {
        
          res.json({
               id:data[0].id,
               nombre:data[0].nombre,
               desde: fo ? fo : null,
               hasta: to ? to : null,
               registros: data.filter(x => new Date(x.fecha) >= new Date(fo) && new Date(x.fecha) <= new Date(to)).length,
               log: data.filter(x => new Date(x.fecha) >= new Date(fo) && new Date(x.fecha) <= new Date(to))
           
         })
        
        }
      
      
    } 
    
    
    
  }).sort("asc").skip().limit(parseInt(li)).select("-_id").select("-__v")
    
    
  //if(err){res.send("No se encontró el Id")}
})







// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})




const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

module.exports = Nombre;
module.exports = Info;

