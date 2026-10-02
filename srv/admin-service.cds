using { sap.presales.demos as db } from '../db/schema';

/**
 * Servicio de administración: gestión de datos maestros.
 * Solo accesible para usuarios con rol DemoAdmin.
 */
@(requires: 'DemoAdmin')
service AdminService @(path: '/admin') {

    entity Tenants          as projection on db.Tenants;
    entity Solutions        as projection on db.Solutions;
    entity Clients          as projection on db.Clients;
    entity ComponentObjects as projection on db.ComponentObjects;
}
