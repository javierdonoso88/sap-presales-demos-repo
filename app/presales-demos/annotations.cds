using DemoService from '../../srv/demo-service';
using { sap.presales.demos as db } from '../../db/schema';

// ─── Demos: List Report ───────────────────────────────────────────────────────

annotate DemoService.Demos with @(
    UI.HeaderInfo: {
        TypeName      : 'Demo',
        TypeNamePlural: 'Demos',
        Title         : { Value: title },
        Description   : { Value: status }
    },
    UI.SelectionFields: [ status, demoDate, createdBy ],
    UI.LineItem: [
        { Value: title,     Label: 'Título' },
        { Value: demoDate,  Label: 'Fecha' },
        { Value: status,    Label: 'Estado' },
        { Value: createdBy, Label: 'Creado por' }
    ]
);

// ─── Demos: Object Page ───────────────────────────────────────────────────────

annotate DemoService.Demos with @(
    UI.FieldGroup #General: {
        Label: 'Información General',
        Data: [
            { Value: title,       Label: 'Título'      },
            { Value: demoDate,    Label: 'Fecha'        },
            { Value: status,      Label: 'Estado'       },
            { Value: createdBy,   Label: 'Creado por'   },
            { Value: createdAt,   Label: 'Fecha creación' },
            { Value: modifiedBy,  Label: 'Modificado por' },
            { Value: description, Label: 'Descripción'  }
        ]
    },
    UI.Facets: [
        {
            $Type : 'UI.ReferenceFacet',
            Label : 'General',
            ID    : 'GeneralInfo',
            Target: '@UI.FieldGroup#General'
        },
        {
            $Type : 'UI.ReferenceFacet',
            Label : 'Sistemas (Tenants)',
            ID    : 'Tenants',
            Target: 'tenants/@UI.LineItem'
        },
        {
            $Type : 'UI.ReferenceFacet',
            Label : 'Soluciones',
            ID    : 'Solutions',
            Target: 'solutions/@UI.LineItem'
        },
        {
            $Type : 'UI.ReferenceFacet',
            Label : 'Objetos utilizados',
            ID    : 'Objects',
            Target: 'objects/@UI.LineItem'
        },
        {
            $Type : 'UI.ReferenceFacet',
            Label : 'Clientes',
            ID    : 'Clients',
            Target: 'clients/@UI.LineItem'
        }
    ]
);

// ─── DemoTenants: subsección en Object Page ───────────────────────────────────

annotate DemoService.DemoTenants with @(
    UI.LineItem: [
        { Value: tenant.name, Label: 'Sistema' },
        { Value: tenant.type, Label: 'Tipo'    },
        { Value: tenant.url,  Label: 'URL'     },
        { Value: notes,       Label: 'Notas'   }
    ]
);

annotate DemoService.DemoTenants with {
    tenant @(
        Common.Text           : tenant.name,
        Common.TextArrangement: #TextOnly,
        Common.ValueList: {
            CollectionPath: 'Tenants',
            Parameters: [
                { $Type: 'Common.ValueListParameterOut',         LocalDataProperty: tenant_ID,  ValueListProperty: 'ID'   },
                { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'name' },
                { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'type' }
            ]
        }
    )
}

// ─── DemoSolutions: subsección en Object Page ────────────────────────────────

annotate DemoService.DemoSolutions with @(
    UI.LineItem: [
        { Value: solution.name, Label: 'Solución' },
        { Value: solution.area, Label: 'Área'     },
        { Value: notes,         Label: 'Notas'    }
    ]
);

annotate DemoService.DemoSolutions with {
    solution @(
        Common.Text           : solution.name,
        Common.TextArrangement: #TextOnly,
        Common.ValueList: {
            CollectionPath: 'Solutions',
            Parameters: [
                { $Type: 'Common.ValueListParameterOut',         LocalDataProperty: solution_ID, ValueListProperty: 'ID'   },
                { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'name' },
                { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'area' }
            ]
        }
    )
}

// ─── DemoObjects: subsección en Object Page ──────────────────────────────────

annotate DemoService.DemoObjects with @(
    UI.LineItem: [
        { Value: object.name,          Label: 'Objeto'    },
        { Value: object.objectType,    Label: 'Tipo'      },
        { Value: object.tenant.name,   Label: 'Tenant'    },
        { Value: object.solution.name, Label: 'Solución'  },
        { Value: notes,                Label: 'Notas'     }
    ]
);

annotate DemoService.DemoObjects with {
    object @(
        Common.Text           : object.name,
        Common.TextArrangement: #TextOnly,
        Common.ValueList: {
            CollectionPath: 'ComponentObjects',
            Parameters: [
                { $Type: 'Common.ValueListParameterOut',         LocalDataProperty: object_ID,  ValueListProperty: 'ID'         },
                { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'name'       },
                { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'objectType' },
                { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'tenant/name' }
            ]
        }
    )
}

// ─── DemoClients: subsección en Object Page ──────────────────────────────────

annotate DemoService.DemoClients with @(
    UI.LineItem: [
        { Value: client.name,        Label: 'Cliente'          },
        { Value: client.industry,    Label: 'Sector'           },
        { Value: presentationDate,   Label: 'Fecha presentación' },
        { Value: result,             Label: 'Resultado'        },
        { Value: feedback,           Label: 'Feedback'         }
    ]
);

annotate DemoService.DemoClients with {
    client @(
        Common.Text           : client.name,
        Common.TextArrangement: #TextOnly,
        Common.ValueList: {
            CollectionPath: 'Clients',
            Parameters: [
                { $Type: 'Common.ValueListParameterOut',         LocalDataProperty: client_ID,  ValueListProperty: 'ID'       },
                { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'name'     },
                { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'industry' }
            ]
        }
    );
    result @Common.ValueListWithFixedValues: true;
}

// ─── Value helps para campos enum ────────────────────────────────────────────

annotate DemoService.Demos with {
    status @(
        Common.ValueListWithFixedValues: true,
        Common.ValueList: {
            CollectionPath: '',
            Label: 'Estado',
            Parameters: [
                { $Type: 'Common.ValueListParameterOut', LocalDataProperty: status, ValueListProperty: 'code' }
            ]
        }
    )
}
