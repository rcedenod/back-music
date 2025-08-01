const TrackBO = class {
  constructor() {}
    async getMySongs(params) {
      const userId = ss.sessionObject.userId;
        
      try {
        const result = await database.executeQuery("public", "getMySongs", [userId]);
        if (!result || !result.rows) {
          console.error("La consulta no devolvió resultados");
          return { sts: false, msg: "Error al obtener mis canciones" };
        }

        return { sts: true, data: result.rows };
      } catch (error) {
        console.error("Error en getMySongs:", error);
        return { sts: false, msg: "Error al ejecutar la consulta" };
      }
    }
        async createTrack(params) {
        const { name, artist, link} = params;
          
          if (!name || !link || !artist ) {
            return { sts: false, msg: "Faltan datos obligatorios" };
          }

        const trackResult = await database.executeQuery("public", "createTrack", [
            name, link, 'nada', artist
          ]);
          
          if (!trackResult) {
            console.error("No se pudo crear la cancion");
            return { sts: false, msg: "No se pudo crear la cancion" };
          }

          const newTrackId = trackResult.rows[0].id_track;

          if (!newTrackId) {
            console.error("No se pudo crear la canción o obtener su ID.");
            return { sts: false, msg: "No se pudo crear la canción." };
          }

        const trackResult2 = await database.executeQuery("public", "addMySong", [
            newTrackId, ss.sessionObject.userId
          ]);
          
          if (!trackResult2) {
            console.error("No se pudo crear la cancion");
            return { sts: false, msg: "No se pudo crear la cancion" };
          }

          return { sts: true, msg: "Cancion creada correctamente" };
    }
};

module.exports = TrackBO;