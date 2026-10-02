using { sap.presales.demos as db } from '../db/schema';

/**
 * Servicio principal: acceso a demos y datos maestros para consulta.
 * Todos los usuarios autenticados pueden leer; DemoUser y DemoAdmin pueden escribir.
 */
service DemoService @(path: '/demo') @(requires: 'authenticated-user') {

    // Demos con draft habilitado (guardar como borrador antes de publicar)
    @odata.draft.enabled
    @(restrict: [
        { grant: 'READ' },
        { grant: ['WRITE', 'CREATE', 'UPDATE', 'DELETE'], to: ['DemoUser', 'DemoAdmin'] }
    ])
    entity Demos as projection on db.Demos;

    // Datos maestros (solo lectura en este servicio; se gestionan desde AdminService)
    @readonly entity Tenants          as projection on db.Tenants;
    @readonly entity Solutions        as projection on db.Solutions;
    @readonly entity Clients          as projection on db.Clients;
    @readonly entity ComponentObjects as projection on db.ComponentObjects;
}
