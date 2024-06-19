// Component type definition
type Component = {
    [key: string]: any;
};

interface SerializedEntity {
    id: string;
    components: Component;
}
  
interface SerializedData {
    entities: SerializedEntity[];
    systems: string[];
}

// Entity type definition with optional ID and generic components
type Entity<T extends Component = {}> = T & { id?: string };

// System type definition
type System = (dt?: number) => void;

// Archetype type definition for grouping entities
type Archetype = Set<string>;
  
// Query result type definition for storing entities and lifecycle hooks
type QueryResult = {
    entities: Entity[];
    onEntityAdded: ((entity: Entity) => void)[];
    onEntityRemoved: ((entity: Entity) => void)[];
};
  
class Sword {
    private entities: Map<string, Entity> = new Map();
    private archetypes: Map<Archetype, QueryResult> = new Map();
    private systems: System[] = [];
    private entityIdCounter = 0;
    private archetypeDefinitions: Map<string, Component> = new Map();
    
    // Lifecycle hooks for entities being added or removed
    public onEntityAdded: ((entity: Entity) => void)[] = [];
    public onEntityRemoved: ((entity: Entity) => void)[] = [];
  
    /**
     * Add a new entity to the ECS.
     * @param entity The entity object to add.
     * @returns The added entity with an assigned ID.
     */
    createEntity<T extends Component>(entity: Entity<Partial<T>>): Entity<Partial<T>> {
      const id = (this.entityIdCounter++).toString();
      entity.id = id;
      this.entities.set(id, entity);
      this.updateArchetypes(entity);
      this.onEntityAdded.forEach(callback => callback(entity));
      return entity;
    }
  
    /**
     * Remove an entity from the ECS.
     * @param entity the entity to remove.
     */
    removeEntity(entity: Entity): void {
      if (entity.id) {
        this.entities.delete(entity.id);
        this.updateArchetypes(entity, true);
        this.onEntityRemoved.forEach(callback => callback(entity));
      }
    }
  
    /**
     * Add a component to an entity.
     * @param entity The entity to add the component to.
     * @param component The component object to add.
     */
    addComponent<T extends Component>(entity: Entity<T>, component: Component): void {
      Object.assign(entity, component);
      this.updateArchetypes(entity);
    }
  
    /**
     * Remove a component from an entity.
     * @param entity The entity to remove the component from.
     * @param componentKey The key of the component to remove.
     */
    removeComponent<T extends Component>(entity: Entity<T>, componentKey: keyof Component): void {
      delete entity[componentKey];
      this.updateArchetypes(entity);
    }
  
    /**
     * Update an entity with multiple parameters at once.
     * @param entity The entity to update.
     * @param updatesOrFunction An object or function containing the updates to apply to the entity.
     */
    updateEntity<T extends Component>(entity: Entity<T>, updatesOrFunction: Partial<T> | ((entity: Entity<T>) => void)): void {
      if (typeof updatesOrFunction === 'function') {
        updatesOrFunction(entity);
      } else {
        Object.assign(entity, updatesOrFunction);
      }

      this.updateArchetypes(entity);
    }
  
    /**
     * Add a system to the ECS.
     * @param system The system function to add.
     */
    addSystem(system: System): void {
      this.systems.push(system);
    }
  
    /**
     * Update all systems in the ECS.
     * @param dt Delta time since the last update.
     */
    update(dt?: number): void {
      for (const system of this.systems) {
        system(dt);
      }
    }
  
    /**
     * Get all entities with specified components.
     * @param componentKeys An array of component keys to filter entities by.
     * @returns A QueryResult object containing entities and lifecycle hooks.
     */
    getEntitiesWithComponents(...componentKeys: (keyof Component)[]): QueryResult {
    //@ts-ignore
      const archetype = new Set<string>(componentKeys);

      if (!this.archetypes.has(archetype)) {
        this.archetypes.set(archetype, {
          entities: [],
          onEntityAdded: [],
          onEntityRemoved: [],
        });
      }
      return this.archetypes.get(archetype)!;
    }
  
    /**
     * Generate an archetype with predefined components.
     * @param name The name of the archetype.
     * @param components The default components for the archetype.
     */
    generateArchetype(name: string, components: Component): void {
      this.archetypeDefinitions.set(name, components);
    }
  
    /**
     * Create an entity based on a predefined archetype.
     * @param name The name of the archetype.
     * @returns The created entity.
     */
    createEntityFromArchetype(name: string, newData: any): Entity | null {
      const components = this.archetypeDefinitions.get(name);
      if (components) {
        return this.createEntity({ ...components, ...newData });
      }
      return null;
    }

    /**
     * Removes one or more systems from running
     * @param systems list of systems to remove
    */  
    stopSystems(...systems: System[]): void {
        for (const system of systems) {
            this.systems.splice(this.systems.indexOf(system), 1);
        }
    }
    
    /**
     * Update the archetypes map when an entity's components change.
     * @param entity The entity whose archetypes are to be updated.
     * @param isRemoval Indicates if the entity is being removed.
     */
    private updateArchetypes(entity: Entity, isRemoval = false): void {
      const entityArchetype = new Set(Object.keys(entity));
      this.archetypes.forEach((queryResult, archetype) => {
        const matches = this.isArchetypeMatch(archetype, entityArchetype);
        if (matches) {
          if (isRemoval) {
            const index = queryResult.entities.indexOf(entity);
            if (index !== -1) {
              queryResult.entities.splice(index, 1);
              queryResult.onEntityRemoved.forEach(callback => callback(entity));
            }
          } else {
            if (!queryResult.entities.includes(entity)) {
              queryResult.entities.push(entity);
              queryResult.onEntityAdded.forEach(callback => callback(entity));
            }
          }
        } else if (queryResult.entities.includes(entity)) {
          const index = queryResult.entities.indexOf(entity);
          if (index !== -1) {
            queryResult.entities.splice(index, 1);
            queryResult.onEntityRemoved.forEach(callback => callback(entity));
          }
        }
      });
    }
  
    /**
     * Check if an entity's components match a given archetype.
     * @param archetype The archetype to check against.
     * @param entityArchetype The entity's component keys as an archetype.
     * @returns True if the entity matches the archetype, false otherwise.
     */
    private isArchetypeMatch(archetype: Archetype, entityArchetype: Archetype): boolean {
      return [...archetype].every(key => entityArchetype.has(key));
    }

  /**
   * Serialize all entities and systems in the ECS.
   * @returns Serialized representation of entities and systems.
   */
  serialize(): SerializedData {
    const serializedEntities: SerializedEntity[] = [];
    const serializedSystems: string[] = [];

    // Serialize entities
    this.entities.forEach((entity, id) => {
      serializedEntities.push({
        id,
        components: { ...entity }, // Copy all components into the serialized entity
      });
    });

    // Serialize systems (assuming systems are functions)
    this.systems.forEach((system) => {
      serializedSystems.push(system.toString()); // Convert system function to string
    });

    return {
      entities: serializedEntities,
      systems: serializedSystems,
    };
  }

  /**
   * Deserialize entities and systems into the ECS.
   * @param data Serialized data containing entities and systems.
   */
  deserialize(data: SerializedData): void {
    // Clear existing entities and systems
    this.entities.clear();
    this.systems = [];

    // Deserialize entities
    data.entities.forEach(serializedEntity => {
      const entity: Entity = { id: serializedEntity.id };
      Object.assign(entity, serializedEntity.components);
      this.entities.set(serializedEntity.id, entity);
      if (parseInt(serializedEntity.id) >= this.entityIdCounter) {
        this.entityIdCounter = parseInt(serializedEntity.id) + 1;
      }
    });

    // Deserialize systems 
    data.systems.forEach(serializedSystem => {
      // Assuming systems were serialized as strings and need to be recompiled
      const systemFunction = new Function(serializedSystem) as System;
      this.systems.push(systemFunction);
    });
  }
}
