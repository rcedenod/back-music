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
  
    async updatePlaylistName(params) {
      try {
        const { playlistId, newName } = params;
        if (!playlistId || !newName) {
          console.log("params: ", params);
          return { sts: false, msg: "Faltan datos obligatorios" };
        }
        
        const result = await database.executeQuery("public", "updatePlaylistName", [
          playlistId,
          newName
        ]);
        if (!result) {
          console.error("No se pudo actualizar la playlist");
          return { sts: false, msg: "No se pudo actualizar la playlist" };
        }
    
        return { sts: true, msg: "Playlist actualizada correctamente" };
      } catch (error) {
        console.error("Error en updatePlaylistName:", error);
        return { sts: false, msg: "Error al actualizar la playlist" };
      }
    }    
  
    async deletePlaylist(params) {
      try{
        const { playlistId } = params;
        if (!playlistId) {
          console.log("params: ", params);
          return { sts: false, msg: "Faltan datos obligatorios" };
        }

        const result = await database.executeQuery("public", "deletePlaylist", [
            playlistId
          ]);

          if (!result) {
            console.error("No se pudo borrar el usuario");
            return { sts: false, msg: "No se pudo borrar el usuario" };
          }

          return { sts: true, msg: "Usuario eliminado correctamente" };
      } catch(error) {
          console.error("Error en deleteUser:", error);
          return { sts: false, msg: "Error al eliminar el usuario" };
      }
    }

};
  
module.exports = PlaylistBO;
  