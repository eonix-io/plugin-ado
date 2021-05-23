
/**
 * Represents a shallow reference to a TeamProject.
 */
export interface ITeamProjectReference {
   /**
    * Project abbreviation.
    */
   abbreviation: string;
   /**
    * Url to default team identity image.
    */
   defaultTeamImageUrl: string;
   /**
    * The project's description (if any).
    */
   description: string;
   /**
    * Project identifier.
    */
   id: string;
   /**
    * Project last update time.
    */
   lastUpdateTime: Date;
   /**
    * Project name.
    */
   name: string;
   /**
    * Project revision.
    */
   revision: number;
   /**
    * Project state.
    */
   state: any;
   /**
    * Url to the full version of the object.
    */
   url: string;
   /**
    * Project visibility.
    */
   visibility: ProjectVisibility;
}


export declare enum ProjectVisibility {
   Unchanged = -1,
   /**
    * The project is only visible to users with explicit access.
    */
   Private = 0,
   /**
    * Enterprise level project visibility
    */
   Organization = 1,
   /**
    * The project is visible to all.
    */
   Public = 2,
   SystemPrivate = 3
}

/**
 * Base class for work item tracking resource references.
 */
export interface IWorkItemTrackingResourceReference {
   url: string;
}

/**
 * Base class for WIT REST resources.
 */
export interface IWorkItemTrackingResource extends IWorkItemTrackingResourceReference {
   /**
    * Link references to related REST resources.
    */
   _links: any;
}
/**
 * Field instance of a work item type.
 */
export interface IWorkItemTypeFieldInstance extends IWorkItemTypeFieldInstanceBase {
   /**
    * The list of field allowed values.
    */
   allowedValues: string[];
   /**
    * Represents the default value of the field.
    */
   defaultValue: string;
}
/**
 * Describes a state transition in a work item.
 */
export interface IWorkItemStateTransition {
   /**
    * Gets a list of actions needed to transition to that state.
    */
   actions: string[];
   /**
    * Name of the next state.
    */
   to: string;
}
/**
 * Work item type state name, color and state category
 */
export interface IWorkItemStateColor {
   /**
    * Category of state
    */
   category: string;
   /**
    * Color value
    */
   color: string;
   /**
    * Work item type state name
    */
   name: string;
}
/**
 * Reference to a work item icon.
 */
export interface IWorkItemIcon {
   /**
    * The identifier of the icon.
    */
   id: string;
   /**
    * The REST URL of the resource.
    */
   url: string;
}
/**
 * Reference to a field in a work item
 */
export interface IWorkItemFieldReference {
   /**
    * The friendly name of the field.
    */
   name: string;
   /**
    * The reference name of the field.
    */
   referenceName: string;
   /**
    * The REST URL of the resource.
    */
   url: string;
}
/**
 * Base field instance for workItemType fields.
 */
export interface IWorkItemTypeFieldInstanceBase extends IWorkItemFieldReference {
   /**
    * Indicates whether field value is always required.
    */
   alwaysRequired: boolean;
   /**
    * The list of dependent fields.
    */
   dependentFields: IWorkItemFieldReference[];
   /**
    * Gets the help text for the field.
    */
   helpText: string;
}

/**
 * Describes a work item type.
 */
export interface IWorkItemType extends IWorkItemTrackingResource {
   /**
    * The color.
    */
   color: string;
   /**
    * The description of the work item type.
    */
   description: string;
   /**
    * The fields that exist on the work item type.
    */
   fieldInstances: IWorkItemTypeFieldInstance[];
   /**
    * The fields that exist on the work item type.
    */
   fields: IWorkItemTypeFieldInstance[];
   /**
    * The icon of the work item type.
    */
   icon: IWorkItemIcon;
   /**
    * True if work item type is disabled
    */
   isDisabled: boolean;
   /**
    * Gets the name of the work item type.
    */
   name: string;
   /**
    * The reference name of the work item type.
    */
   referenceName: string;
   /**
    * Gets state information for the work item type.
    */
   states: IWorkItemStateColor[];
   /**
    * Gets the various state transition mappings in the work item type.
    */
   transitions: {
      [key: string]: IWorkItemStateTransition[];
   };
   /**
    * The XML form.
    */
   xmlForm: string;
}
/**
 * Link description.
 */
export interface ILink {
   /**
    * Collection of link attributes.
    */
   attributes: {
      [key: string]: any;
   };
   /**
    * Relation type.
    */
   rel: string;
   /**
    * Link url.
    */
   url: string;
}
/**
 * Represents the reference to a specific version of a comment on a Work Item.
 */
export interface IWorkItemCommentVersionRef extends IWorkItemTrackingResourceReference {
   /**
    * The id assigned to the comment.
    */
   commentId: number;
   /**
    * [Internal] The work item revision where this comment was originally added.
    */
   createdInRevision: number;
   /**
    * [Internal] Specifies whether comment was deleted.
    */
   isDeleted: boolean;
   /**
    * [Internal] The text of the comment.
    */
   text: string;
   /**
    * The version number.
    */
   version: number;
}
/**
 * Describes a work item.
 */
export interface IWorkItem extends IWorkItemTrackingResource {
   /**
    * Reference to a specific version of the comment added/edited/deleted in this revision.
    */
   commentVersionRef: IWorkItemCommentVersionRef;
   /**
    * Map of field and values for the work item.
    */
   fields: {
      [key: string]: any;
   };
   /**
    * The work item ID.
    */
   id: number;
   /**
    * Relations of the work item.
    */
   relations: ILink[];
   /**
    * Revision number of the work item.
    */
   rev: number;
}

/**
 * Enum to control error policy in a bulk get work items request.
 */
export declare enum IWorkItemErrorPolicy {
   /**
    * Fail work error policy.
    */
   Fail = 1,
   /**
    * Omit work error policy.
    */
   Omit = 2
}
/**
 * Flag to control payload properties from get work item command.
 */
export declare enum IWorkItemExpand {
   /**
    * Default behavior.
    */
   None = 0,
   /**
    * Relations work item expand.
    */
   Relations = 1,
   /**
    * Fields work item expand.
    */
   Fields = 2,
   /**
    * Links work item expand.
    */
   Links = 3,
   /**
    * Expands all.
    */
   All = 4
}
/**
 * Describes a request to get a set of work items
 */
export interface IWorkItemBatchGetRequest {
   /**
    * The expand parameters for work item attributes. Possible options are \{ None, Relations, Fields, Links, All \}
    */
   $expand: IWorkItemExpand;
   /**
    * AsOf UTC date time string
    */
   asOf: Date;
   /**
    * The flag to control error policy in a bulk get work items request. Possible options are \{Fail, Omit\}.
    */
   errorPolicy: IWorkItemErrorPolicy;
   /**
    * The requested fields
    */
   fields: string[];
   /**
    * The requested work item ids
    */
   ids: number[];
}
/**
 * Describes a field on a work item and it's properties specific to that work item type.
 */
export interface IWorkItemField extends IWorkItemTrackingResource {
   /**
    * Indicates whether the field is sortable in server queries.
    */
   canSortBy: boolean;
   /**
    * The description of the field.
    */
   description: string;
   /**
    * Indicates whether this field is deleted.
    */
   isDeleted: boolean;
   /**
    * Indicates whether this field is an identity field.
    */
   isIdentity: boolean;
   /**
    * Indicates whether this instance is picklist.
    */
   isPicklist: boolean;
   /**
    * Indicates whether this instance is a suggested picklist .
    */
   isPicklistSuggested: boolean;
   /**
    * Indicates whether the field can be queried in the server.
    */
   isQueryable: boolean;
   /**
    * The name of the field.
    */
   name: string;
   /**
    * If this field is picklist, the identifier of the picklist associated, otherwise null
    */
   picklistId: string;
   /**
    * Indicates whether the field is [read only].
    */
   readOnly: boolean;
   /**
    * The reference name of the field.
    */
   referenceName: string;
   /**
    * The supported operations on this field.
    */
   supportedOperations: IWorkItemFieldOperation[];
   /**
    * The type of the field.
    */
   type: IFieldType;
   /**
    * The usage of the field.
    */
   usage: IFieldUsage;
}

/**
 * Enum for field usages.
 */
export declare enum IFieldUsage {
   /**
    * Empty usage.
    */
   None = 0,
   /**
    * Work item field usage.
    */
   WorkItem = 1,
   /**
    * Work item link field usage.
    */
   WorkItemLink = 2,
   /**
    * Treenode field usage.
    */
   Tree = 3,
   /**
    * Work Item Type Extension usage.
    */
   WorkItemTypeExtension = 4
}
/**
 * Enum for field types.
 */
export declare enum IFieldType {
   /**
    * String field type.
    */
   String = 0,
   /**
    * Integer field type.
    */
   Integer = 1,
   /**
    * Datetime field type.
    */
   DateTime = 2,
   /**
    * Plain text field type.
    */
   PlainText = 3,
   /**
    * HTML (Multiline) field type.
    */
   Html = 4,
   /**
    * Treepath field type.
    */
   TreePath = 5,
   /**
    * History field type.
    */
   History = 6,
   /**
    * Double field type.
    */
   Double = 7,
   /**
    * Guid field type.
    */
   Guid = 8,
   /**
    * Boolean field type.
    */
   Boolean = 9,
   /**
    * Identity field type.
    */
   Identity = 10,
   /**
    * String picklist field type. When creating a string picklist field from REST API, use "String" FieldType.
    */
   PicklistString = 11,
   /**
    * Integer picklist field type. When creating a integer picklist field from REST API, use "Integer" FieldType.
    */
   PicklistInteger = 12,
   /**
    * Double picklist field type. When creating a double picklist field from REST API, use "Double" FieldType.
    */
   PicklistDouble = 13
}
/**
 * Describes a work item field operation.
 */
export interface IWorkItemFieldOperation {
   /**
    * Friendly name of the operation.
    */
   name: string;
   /**
    * Reference name of the operation.
    */
   referenceName: string;
}