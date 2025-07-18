const PersonBO = class {

    constructor() {}

    async getPeople(params){
        try {
            const result = await database.executeQuery("public", "getPeople", []);
        
            if (!result || !result.rows) {
              console.error("La consulta no devolvio resultados");
              return { sts: false, msg: "Error al obtener personas" };
            }
        
            return { sts: true, data: result.rows };
          } catch (error) {
            console.error("Error en getPeople:", error);
            return { sts: false, msg: "Error al ejecutar la consulta" };
          }
    }

    async getPersonById(params) {
        try {
            const result = await database.executeQuery("public", "getPersonById", [params.userId]);
        
            if (!result || !result.rows || result.rows.length === 0) {
              console.error("La consulta no devolvio resultados");
              return { sts: false, msg: "Error al obtener persona" };
            }
        
            return { sts: true, data: result.rows[0] };
          } catch (error) {
            console.error("Error en getPersonById:", error);
            return { sts: false, msg: "Error al ejecutar la consulta" };
          }
    }

    async updatePersonName(params) {
      try {
        if (!params.name || !params.personId) {
          return { sts: false, msg: "Faltan datos obligatorios" };
        }
        
          const userResult = await database.executeQuery("public", "updatePersonName", [
            params.name,
            params.personId
          ]);
          if (!userResult || userResult.rowCount === 0) {
            console.error("No se pudo actualizar el nombre");
            return { sts: false, msg: "No se pudo actualizar el nombre" };
          }
      
          return { sts: true, msg: "Nombre actualizado correctamente" };
        
      } catch (error) {
        console.error("Error en updatePersonName:", error);
        return { sts: false, msg: "Error al actualizar el nombre" };
      }
    }

    async updatePersonLastName(params) {
      try {
        if (!params.lastName || !params.personId) {
          return { sts: false, msg: "Faltan datos obligatorios" };
        }
        
          const userResult = await database.executeQuery("public", "updatePersonLastName", [
            params.lastName,
            params.personId
          ]);
          if (!userResult || userResult.rowCount === 0) {
            console.error("No se pudo actualizar el apellido");
            return { sts: false, msg: "No se pudo actualizar el apellido" };
          }
      
          return { sts: true, msg: "Apellido actualizado correctamente" };
        
      } catch (error) {
        console.error("Error en updatePersonLastName:", error);
        return { sts: false, msg: "Error al actualizar el apellido" };
      }
    }
}

module.exports = PersonBO;