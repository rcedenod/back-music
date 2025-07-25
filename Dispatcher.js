const express = require('express');
let fs = require("fs");
const nodemailer = require('nodemailer');
const app = express();
const cors = require('cors');
const session = require('express-session');
const { profile } = require('console');
const port = 3000;

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));
app.use(express.json()); // Esto asegura que req.body sea parseado correctamente

// Objeto global para almacenar los códigos de restablecimiento de contraseña
// Estructura: { [email]: { code: "123456", expires: timestamp } }
global.resetCodes = {};
global.ss = new (require('./Session'))(app);
global.database = new (require('./DataBase'))(() => {global.sc = new (require('./Security'))(app);});

  app.post('/login', async (req, res) => {
    if (ss.sessionExist(req)) {
        return res.status(400).json({ sts: true, msg: "Ya tienes una sesion activa" });
    }

    await ss.authenticateUser(req);

    if (!ss.sessionObject.status) {
        return res.status(401).json({ sts: false, msg: "Correo o contraseña inválidos" });
    }
    
    // Buscar los perfiles del usuario
    let profileResults = await database.executeQuery("security", "getUserProfiles", [ss.sessionObject.email]);
    
    if (!profileResults || !profileResults.rows || profileResults.rows.length === 0) {
        return res.status(403).json({ sts: false, msg: "No tienes perfiles asignados" });
    }

    // Si el usuario tiene más de un perfil, enviamos la lista de perfiles para que seleccione
    if (profileResults.rows.length > 1) {
        return res.json({
            sts: true,
            msg: "Selecciona un perfil",
            profiles: profileResults.rows.map(row => ({
                id_profile: row.fk_id_profile,
                profile: row.profile
            }))
        });
    }

    // Si solo tiene un perfil, iniciamos sesión directamente
    ss.createSession(req, profileResults.rows[0].fk_id_profile);
    console.log(`${req.body.email} inició sesión con el perfil ${profileResults.rows[0].profile}`);

    res.json({
        sts: true,
        msg: "Usuario autenticado",
        options: sc.getPermissionOption(req)
    });
  });

  app.post('/selectProfile', async (req, res) => {

    const { id_profile } = req.body;
    if (!id_profile) {
        return res.status(400).json({ sts: false, msg: "Debes seleccionar un perfil" });
    }

    // Verificamos si el perfil pertenece al usuario autenticado
    let profileResults = await database.executeQuery("security", "getUserProfiles", [ss.sessionObject.email]);
    const validProfile = profileResults.rows.find(row => row.fk_id_profile === id_profile);

    if (!validProfile) {
        return res.status(403).json({ sts: false, msg: "Perfil no válido" });
    }

    // Creamos la sesión con el perfil seleccionado
    ss.createSession(req, id_profile);
    console.log(`El usuario ${ss.sessionObject.email} seleccionó el perfil ${validProfile.profile}`);

    res.json({
        sts: true,
        msg: "Perfil seleccionado correctamente",
        options: sc.getPermissionOption(req)
    });
  });

  app.post('/logout', async (req, res) => {    
      try {
          await ss.closeSession(req);
          // Limpia la cookie (el nombre por defecto es "connect.sid")
          // res.clearCookie('connect.sid');
          res.json({ sts: true, msg: "Logout exitoso" });
      } catch (error) {
          res.status(500).send("Error al cerrar la sesión");
      }
  });

app.post('/createUser', async (req, res) => {
  try {
    // 1) Validación de campos obligatorios
    const { name, last_name, email, password, userName } = req.body;
    if (!name || !last_name || !email || !password || !userName) {
      return res
        .status(400)
        .json({ sts: false, msg: 'Faltan datos obligatorios' });
    }

    // 2) Insertar en public.person y obtener id_person
    const personResult = await database.executeQuery(
      'public',
      'createPerson',
      [name, last_name]
    );
    if (
      !personResult ||
      !personResult.rows ||
      personResult.rows.length === 0
    ) {
      return res
        .status(500)
        .json({ sts: false, msg: 'No se pudo crear la persona' });
    }
    const id_person = personResult.rows[0].id_person;
    console.log(`Persona creada con id_person: ${id_person}`);

    // 3) Bloque try/catch exclusivo para el INSERT en security.user
    try {
      const userResult = await database.executeQuery(
        'security',
        'createUser',
        [email, password, userName, id_person]
      );

      const id_user = userResult.rows[0].id_user;
      const id_profile = 1;

      // 4) Insertar en user_profile para asignar perfil
      const userProfileResult = await database.executeQuery(
        'security',
        'createUserProfile',
        [id_user, id_profile]
      );

      if (userProfileResult && userProfileResult.rowCount > 0) {
        console.log(`El usuario ${email} fue creado correctamente`);
        return res.status(200).json({ sts: true, msg: 'Usuario creado correctamente' });
      } else {
        return res
          .status(500)
          .json({ sts: false, msg: 'No se pudo asignar el perfil' });
      }
    } catch (error) {
      console.log('Error al crear el usuario:', error.message);
      
      // 5) Aquí caen TODOS los errores que deriven de createUser(...)
      if (
        error.message &&
        error.message.includes('duplicate key value') &&
        error.message.includes('unq_email')
      ) {
        return res
          .status(400)
          .json({ sts: false, msg: 'El email ya está registrado' });
      }

      if (
        error.message &&
        error.message.includes('duplicate key value') &&
        error.message.includes('unq_username')
      ) {
        return res
          .status(400)
          .json({ sts: false, msg: 'El nombre de usuario ya está en uso' });
      }

      //Si no era duplicado de email ni de username
      console.error('Error al crear el usuario:', error);
      return res
        .status(500)
        .json({ sts: false, msg: 'Error al crear el usuario' });
    }
  } catch (error) {
    // 6) Cualquier otro error
    console.error('Error en createUser endpoint:', error);
    return res
      .status(500)
      .json({ sts: false, msg: 'Error al procesar la petición' });
  }
});




  // Endpoint: Enviar código de restablecimiento de contraseña
  app.post('/resetPassword', async (req, res) => {
    const emailRegex = /^\S+@\S+\.\S+$/; // Expresión regular para email
    const maxEmailLength = 50; // Límite de caracteres para el email
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ sts: false, msg: "El campo email es obligatorio." });
      }

      if (email.length > maxEmailLength) {
        return res.status(400).json({ sts: false, msg: "Email demasiado largo." });
      }
      if (!emailRegex.test(email)) {
        return res.status(400).json({ sts: false, msg: "Email inválido." });
      }

      let userCheck = await database.executeQuery("security", "getUserByEmail", [email]);
      if (!userCheck || !userCheck.rows || userCheck.rows.length === 0) {
        return res.status(400).json({ sts: false, msg: "El correo no está registrado." });
      }

      // Genera un código aleatorio de 6 dígitos
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      // Establece expiración en 15 minutos
      const expires = Date.now() + 15 * 60 * 1000;
      global.resetCodes[email] = { code, expires, email };

      // Configura el transporter
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
          user: "uru.bibliotecabot@gmail.com",
          pass: "qxln utpf sqlm gmcq"
        }
      });

      const mailOptions = {
        from: "uru.bibliotecabot@gmail.com",
        to: email,
        subject: "Código para restablecer contraseña",
        text: `Tu código de restablecimiento es: ${code}`
      };

      await transporter.sendMail(mailOptions);
      res.json({ sts: true, msg: "Correo enviado con el código de restablecimiento." });
    } catch (error) {
      console.error("Error en /resetPassword:", error);
      res.status(500).json({ sts: false, msg: "Error al enviar el correo." });
    }
  });

  // Endpoint: Confirmar código y actualizar la contraseña
  app.post('/confirmResetPassword', async (req, res) => {
    try {
      const { code, newPassword } = req.body;
  
      // Busca un código almacenado sin requerir el email
      const storedEntry = Object.values(global.resetCodes).find(entry => entry.code === code);
  
      if (!storedEntry) {
        return res.status(400).json({ sts: false, msg: "Código incorrecto o no encontrado." });
      }
  
      const { email, expires } = storedEntry;
  
      if (Date.now() > expires) {
        delete global.resetCodes[email];
        return res.status(400).json({ sts: false, msg: "El código ha expirado." });
      }
  
      // Actualiza la contraseña en la base de datos
      let updateResult = await database.executeQuery("security", "updatePassword", [newPassword, email]);
  
      if (updateResult && updateResult.rowCount > 0) {
        delete global.resetCodes[email];
        res.json({ sts: true, msg: "Contraseña actualizada correctamente." });
      } else {
        res.status(500).json({ sts: false, msg: "No se pudo actualizar la contraseña." });
      }
    } catch (error) {
      console.error("Error en /confirmResetPassword:", error);
      res.status(500).json({ sts: false, msg: "Error al actualizar la contraseña." });
    }
  });
  

  // Endpoint: Restablecer el email
  // Se requiere que se envíe la cédula (number_id), la contraseña actual y el nuevo email.
  app.post('/resetEmail', async (req, res) => {
    try {
      const { number_id, password, newEmail } = req.body;
      if (!number_id || !password || !newEmail) {
        return res.status(400).json({ sts: false, msg: "Faltan datos obligatorios" });
      }

      // Verifica que exista un usuario con esa cédula y contraseña.
      let userCheck = await database.executeQuery("security", "getUserByNumberAndPassword", [number_id, password]);
      if (!userCheck || !userCheck.rows || userCheck.rows.length === 0) {
        return res.status(400).json({ sts: false, msg: "Credenciales incorrectas" });
      }

      // Actualiza el email en la tabla security.user.
      let updateResult = await database.executeQuery("security", "updateUserEmail", [newEmail, number_id, password]);
      if (updateResult && updateResult.rowCount > 0) {
        res.json({ sts: true, msg: "Email actualizado correctamente." });
      } else {
        res.status(500).json({ sts: false, msg: "No se pudo actualizar el email." });
      }
    } catch (error) {
      console.error("Error en /resetEmail:", error);
      res.status(500).json({ sts: false, msg: "Error al actualizar el email." });
    }
  });

  app.get('/menuOptions', (req, res) => {
    // Verifica que la sesión exista y que el usuario esté autenticado
    if (!req.session || !req.session.profile) {
      return res.status(401).json({ sts: false, msg: "No autorizado" });
    }
    // Obtiene las opciones de menú basadas en el perfil
    const options = sc.getPermissionOption(req);
    console.log('Opciones del menu: ', options);
    res.json({ sts: true, options });
  });

  app.get('/checkSession', (req, res) => {
    if (ss.sessionExist(req)) {
      res.json({ authenticated: true, session: req.session });
    } else {
      res.json({ authenticated: false });
    }
  });

  app.post('/ToProcess', async function (req, res) {
    if(ss.sessionExist(req)){
    /*
      if(sc.hasPermissionMethod({
        profile: req.session.profile,
        objectName: req.body.objectName,
        methodName: req.body.methodName,
        params: req.body.params
      })){
        let r = await sc.exeMethod(req);
        res.send(JSON.stringify(r));
      }
      else {
        res.send({sts:false, msg:'No tiene permisos para ejecutar el metodo...'});
      }
    */
      let r = await sc.exeMethod(req);
      res.send(JSON.stringify(r));
      
    } else {
      res.send({sts:false, msg:'debe hacer login...'});
    }
  });

  app.listen(port, () => {
    console.log(`Servidor activo en el puerto ${port}`)
  })