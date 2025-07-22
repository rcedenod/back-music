const PlaylistBO = class {
    constructor() {}
  
    async getUserPlaylists(params) {
      const userId = ss.sessionObject.userId;
        
      try {
        const result = await database.executeQuery("public", "getUserPlaylists", [userId]);
        if (!result || !result.rows) {
          console.error("La consulta no devolvió resultados");
          return { sts: false, msg: "Error al obtener usuarios" };
        }

        return { sts: true, data: result.rows };
      } catch (error) {
        console.error("Error en getUsers:", error);
        return { sts: false, msg: "Error al ejecutar la consulta" };
      }
    }
  
    async getPlaylistDetailsAndSongs(params) {
      try {
        const { playlistId } = params;

        if (!playlistId) {
          return { sts: false, msg: "Faltan datos obligatorios" };
        }

        const result = await database.executeQuery("public", "getPlaylistDetailsAndSongs", [playlistId]);
        if (!result || !result.rows) {
          console.error("La consulta no devolvió resultados");
          return { sts: false, msg: "Error al obtener canciones de la playlist" };
        }

        return { sts: true, data: result.rows };
      } catch (error) {
        console.error("Error en getPlaylistDetailsAndSongs:", error);
        return { sts: false, msg: "Error al ejecutar la consulta" };
      }
    }

    async createPlaylist(params) {
       const userId = ss.sessionObject.userId;

      try {
        // Validar que existan todos los datos obligatorios
        const { name } = params;
        
        if (!name) {
          return { sts: false, msg: "Faltan datos obligatorios" };
        }
        console.log(params);
        
        const playlistResult = await database.executeQuery("public", "createPlaylist", [
          name, userId, false
        ]);
        console.log("playlist: ", playlistResult);
        
        if (!playlistResult) {
          console.error("No se pudo crear la playlist");
          return { sts: false, msg: "No se pudo crear la playlist" };
        }
        else {
          return { sts: true, msg: "Playlist creada correctamente" };
        }
      } catch (error) {
        console.error("Error en createPlaylist:", error);
        return { sts: false, msg: "Error al crear la playlist" };
      }
    }
  
    async updateUser(params) {
      try {
        // Se espera recibir los siguientes parámetros:
        const { id_user, id_person, name, lastName, email, password, username } = params;
        if (!id_user || !id_person || !name || !lastName || !email || !password || !username) {
          console.log("params: ", params);
          return { sts: false, msg: "Faltan datos obligatorios" };
        }
        
        // Actualizar la persona en la tabla public.person
        const personResult = await database.executeQuery("public", "updatePerson", [
          name,
          lastName,
          id_person
        ]);
        if (!personResult || personResult.rowCount === 0) {
          console.error("No se pudo actualizar la persona");
          return { sts: false, msg: "No se pudo actualizar la persona" };
        }
    
        // Actualizar el usuario en la tabla security.user
        const userResult = await database.executeQuery("security", "updateUser", [
          email,
          password,
          username,
          id_user
        ]);
        if (!userResult || userResult.rowCount === 0) {
          console.error("No se pudo actualizar el usuario");
          return { sts: false, msg: "No se pudo actualizar el usuario" };
        }
    
        return { sts: true, msg: "Usuario actualizado correctamente" };
      } catch (error) {
        console.error("Error en updateUser:", error);
        return { sts: false, msg: "Error al actualizar el usuario" };
      }
    }    

    async updateUserName(params) {
      try {
        if (!params.userName) {
          return { sts: false, msg: "Faltan datos obligatorios" };
        }
        
          const userResult = await database.executeQuery("security", "updateUserName", [
            params.userName,
            ss.sessionObject.userId
          ]);
          if (!userResult || userResult.rowCount === 0) {
            console.error("No se pudo actualizar el username");
            return { sts: false, msg: "No se pudo actualizar el username" };
          }
      
          return { sts: true, msg: "Username actualizado correctamente" };
        
      } catch (error) {
        console.error("Error en updateUserName:", error);
        return { sts: false, msg: "Error al actualizar el username" };
      }
    }

    async updateUserPassword(params) {
      try {
        if (!params.password) {
          return { sts: false, msg: "Faltan datos obligatorios" };
        }
        
          const userResult = await database.executeQuery("security", "updateUserPassword", [
            params.password,
            ss.sessionObject.userId
          ]);
          if (!userResult || userResult.rowCount === 0) {
            console.error("No se pudo actualizar la contraseña");
            return { sts: false, msg: "No se pudo actualizar el la contraseña" };
          }
      
          return { sts: true, msg: "Contraseña actualizada correctamente" };
        
      } catch (error) {
        console.error("Error en updateUserPassword:", error);
        return { sts: false, msg: "Error al actualizar la contraseña" };
      }
    }

    async updateUserEmail(params) {
      try {
        if (!params.email) {
          return { sts: false, msg: "Faltan datos obligatorios" };
        }
        
          const userResult = await database.executeQuery("security", "updateUserEmail", [
            params.email,
            ss.sessionObject.userId
          ]);
          if (!userResult || userResult.rowCount === 0) {
            console.error("No se pudo actualizar el correo");
            return { sts: false, msg: "No se pudo actualizar el correo" };
          }
      
          return { sts: true, msg: "Correo actualizado correctamente" };
        
      } catch (error) {
        console.error("Error en updateUserEmail:", error);
        return { sts: false, msg: "Error al actualizar el correo" };
      }
    }
  
    async deleteUser(params) {
      try{
        const userResult = await database.executeQuery("security", "deleteUser", [
            ss.sessionObject.userId
          ]);

          if (!userResult || userResult.rowCount === 0) {
            console.error("No se pudo borrar el usuario");
            return { sts: false, msg: "No se pudo borrar el usuario" };
          }

          return { sts: true, msg: "Usuario eliminado correctamente" };
      } catch(error) {
          console.error("Error en deleteUser:", error);
          return { sts: false, msg: "Error al eliminar el usuario" };
      }
    }

async deleteUsers(params) {
  try {
    const { userId } = params;
    if (!userId) {
      console.log("deleteUsers recibió params incorrectos:", params);
      return { sts: false, msg: "Faltan datos obligatorios" };
    }

    /*
    // 1) Obtener todos los id_note del usuario
    const notesResult = await database.executeQuery(
      "public",
      "getNotesByUser",
      [userId]
    );
    if (!notesResult || !notesResult.rows) {
      return { sts: false, msg: "Error al obtener las notas del usuario" };
    }
    const noteIds = notesResult.rows.map(r => r.id_note); // ej. [12, 34, 56]

    // 2) Borrar dependencias de las notas (favorites y category_note)
    if (noteIds.length > 0) {
      // Construir literal de arreglo: "{12,34,56}"
      const pgNoteIds = `{${noteIds.join(",")}}`;

      // a) Eliminar de favorites
      await database.executeQuery(
        "public",
        "deleteFavoritesByNoteIds",
        [pgNoteIds]
      );

      // b) Eliminar de category_note
      await database.executeQuery(
        "public",
        "deleteCategoryNoteByNoteIds",
        [pgNoteIds]
      );
    }

    // 3) Borrar las notas en sí (entero)
    await database.executeQuery(
      "public",
      "deleteNotesByUser",
      [userId]
    );

    // 4) Borrar las carpetas (entero)
    await database.executeQuery(
      "public",
      "deleteCategoriesByUser",
      [userId]
    );

    // 5) Borrar historial de auditoría (entero)
    await database.executeQuery(
      "security",
      "deleteAuditByUser",
      [userId]
    );

    // 6) Borrar user_profile (entero)
    await database.executeQuery(
      "security",
      "deleteUserProfileByUserId",
      [userId]
    );
    */

    // 7) Borrar el usuario (entero)
    await database.executeQuery(
      "security",
      "deleteUser",
      [userId]
    );

    /*
    await database.executeQuery(
      "public",
      "deletePerson",
      [personId]
    );
    */

    return { sts: true, msg: "Usuario y sus dependencias eliminados correctamente" };
  } catch (error) {
    console.error("Error en deleteUsers:", error);
    return { sts: false, msg: "Error al eliminar el usuario y sus datos" };
  }
}

};
  
module.exports = PlaylistBO;
  