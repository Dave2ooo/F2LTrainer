declare const _default: import('convex/server').SchemaDefinition<
	{
		solves: import('convex/server').TableDefinition<
			import('convex/values').VObject<
				{
					time?: number | undefined;
					side?: string | undefined;
					sessionId?: string | undefined;
					recognitionTime?: number | undefined;
					executionTime?: number | undefined;
					deleted?: boolean | undefined;
					deletedAt?: number | undefined;
					id: string;
					groupId: string;
					caseId: number;
					timestamp: number;
					auf: string;
					scrambleSelection: number;
					trainMode: string;
					tokenIdentifier: string;
				},
				{
					id: import('convex/values').VString<string, 'required'>;
					groupId: import('convex/values').VString<string, 'required'>;
					caseId: import('convex/values').VFloat64<number, 'required'>;
					time: import('convex/values').VFloat64<number | undefined, 'optional'>;
					timestamp: import('convex/values').VFloat64<number, 'required'>;
					auf: import('convex/values').VString<string, 'required'>;
					side: import('convex/values').VString<string | undefined, 'optional'>;
					scrambleSelection: import('convex/values').VFloat64<number, 'required'>;
					sessionId: import('convex/values').VString<string | undefined, 'optional'>;
					recognitionTime: import('convex/values').VFloat64<number | undefined, 'optional'>;
					executionTime: import('convex/values').VFloat64<number | undefined, 'optional'>;
					trainMode: import('convex/values').VString<string, 'required'>;
					deleted: import('convex/values').VBoolean<boolean | undefined, 'optional'>;
					deletedAt: import('convex/values').VFloat64<number | undefined, 'optional'>;
					tokenIdentifier: import('convex/values').VString<string, 'required'>;
				},
				'required',
				| 'id'
				| 'groupId'
				| 'caseId'
				| 'time'
				| 'timestamp'
				| 'auf'
				| 'side'
				| 'scrambleSelection'
				| 'sessionId'
				| 'recognitionTime'
				| 'executionTime'
				| 'trainMode'
				| 'deleted'
				| 'deletedAt'
				| 'tokenIdentifier'
			>,
			{
				by_tokenIdentifier: ['tokenIdentifier', '_creationTime'];
			},
			{},
			{}
		>;
		sessions: import('convex/server').TableDefinition<
			import('convex/values').VObject<
				{
					deleted?: boolean | undefined;
					deletedAt?: number | undefined;
					favorite?: boolean | undefined;
					id: string;
					tokenIdentifier: string;
					name: string;
					settings: any;
					createdAt: number;
					lastPlayedAt: number;
					lastModified: number;
					archived: boolean;
				},
				{
					id: import('convex/values').VString<string, 'required'>;
					name: import('convex/values').VString<string, 'required'>;
					settings: import('convex/values').VAny<any, 'required', string>;
					createdAt: import('convex/values').VFloat64<number, 'required'>;
					lastPlayedAt: import('convex/values').VFloat64<number, 'required'>;
					lastModified: import('convex/values').VFloat64<number, 'required'>;
					archived: import('convex/values').VBoolean<boolean, 'required'>;
					deleted: import('convex/values').VBoolean<boolean | undefined, 'optional'>;
					deletedAt: import('convex/values').VFloat64<number | undefined, 'optional'>;
					favorite: import('convex/values').VBoolean<boolean | undefined, 'optional'>;
					tokenIdentifier: import('convex/values').VString<string, 'required'>;
				},
				'required',
				| 'id'
				| 'deleted'
				| 'deletedAt'
				| 'tokenIdentifier'
				| 'name'
				| 'settings'
				| 'createdAt'
				| 'lastPlayedAt'
				| 'lastModified'
				| 'archived'
				| 'favorite'
				| `settings.${string}`
			>,
			{
				by_tokenIdentifier: ['tokenIdentifier', '_creationTime'];
			},
			{},
			{}
		>;
	},
	true
>;
export default _default;
