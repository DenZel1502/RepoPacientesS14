//Invocamos a la conexion de la DB
const conexion = require('../database/db');
const { uploadFile, AWS_BUCKET_NAME, client } = require('../s3');
const { DeleteObjectCommand } = require("@aws-sdk/client-s3");


//GUARDAR un REGISTRO
exports.save = async (req, res) => {
    const apellidos = req.body.apellidos;
    const nombres = req.body.nombres;
    const sexo = req.body.sexo;
    const especialidad = req.body.especialidad;
    const imagen = req.file.filename;

    const prod = {
        apellidos: apellidos,
        nombres: nombres,
        sexo: sexo,
        especialidad: especialidad,
        imagen: imagen
    };

    await uploadFile(req.file, prod);
    conexion.query('INSERT INTO paciente SET ?',{apellidos: apellidos, nombres: nombres, sexo: sexo, especialidad: especialidad, imagen: imagen}, (error, results)=>{
        if(error){
            console.log(error);
        }else{
            res.redirect('/');         
        }
    });
};

//ACTUALIZAR un REGISTRO
exports.update = async (req, res) => {
    const idpaciente = req.body.idpaciente;
    const apellidos = req.body.apellidos;
    const nombres = req.body. nombres;
    const sexo = req.body.sexo;
    const especialidad = req.body.especialidad;
    const nuevaImagen = req.file.filename;
  
    try {
      // Obtener el nombre de la imagen anterior desde la base de datos
      const nombreImagenAnterior = await obtenerNombreImagenAnteriorDesdeBD(idpaciente);
  
      // Eliminar la imagen anterior del bucket
      await eliminarImagenDelBucket(nombreImagenAnterior);
  
      const prod = {
        apellidos: apellidos,
        nombres: nombres,
        sexo: sexo,
        especialidad: especialidad,
        imagen: nuevaImagen
    };

    // Cargar la nueva imagen en el bucket
    await uploadFile(req.file, prod);
  
      // Actualizar la información del producto en la base de datos
      const query = 'UPDATE paciente SET ? WHERE idpaciente = ?';
      const values = {
        apellidos: apellidos,
        nombres: nombres,
        sexo: sexo,
        especialidad: especialidad,
        imagen: nuevaImagen,
      };
  
      conexion.query(query, [values, idpaciente], (error, results) => {
        if (error) {
          console.log(error);
        } else {
          res.redirect('/');
        }
      });
    } catch (error) {
      console.log(error);
      res.status(500).send('Error en el servidor');
    }
  };
  
  async function obtenerNombreImagenAnteriorDesdeBD(idpaciente) {
    return new Promise((resolve, reject) => {
      conexion.query(
        'SELECT imagen FROM paciente WHERE idpaciente = ?',
        [idpaciente],
        (error, results) => {
          if (error) {
            reject(error);
          } else {
            if (results.length > 0) {
              resolve(results[0].imagen);
            } else {
              reject('No se encontró el producto');
            }
          }
        }
      );
    });
  }
  
  async function eliminarImagenDelBucket(nombreImagen) {
    const deleteParams = {
      Bucket: AWS_BUCKET_NAME,
      Key: nombreImagen,
    };
  
    await client.send(new DeleteObjectCommand(deleteParams));
  }
  
  