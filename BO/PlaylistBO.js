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

    async addToPlaylist(params) {
      try {
          const { playlistId, trackName, trackLink, trackCover, trackArtist } = params;
          
          if (!playlistId || !trackName || !trackCover || !trackLink ) {
            return { sts: false, msg: "Faltan datos obligatorios" };
          }

          const trackResult = await database.executeQuery("public", "createTrack", [
            trackName, trackLink, trackCover, trackArtist
          ]);
          
          if (!trackResult) {
            console.error("No se pudo crear la cancion");
            return { sts: false, msg: "No se pudo crear la cancion" };
          }

          console.log(trackResult.rows);

          const newTrackId = trackResult.rows[0].id_track;

          if (!newTrackId) {
            console.error("No se pudo crear la canción o obtener su ID.");
            return { sts: false, msg: "No se pudo crear la canción." };
          }

          const playlistResult = await database.executeQuery("public", "addToPlaylist", [
            playlistId, newTrackId
          ]);
          
          if (!playlistResult) {
            console.error("No se pudo crear la playlist");
            return { sts: false, msg: "No se pudo crear la playlist" };
          }

          return { sts: true, msg: "Cancion añadida a la playlist correctamente" };

        } catch (error) {
          console.error("Error en addToPlaylist:", error);
          return { sts: false, msg: "Error al añadir a playlist" };
        }
    }

};
  
module.exports = PlaylistBO;
  