# Sword 🗡️

Sword is a lightweight Entity Component System library for JavaScript and Typescript with support for archetypes, typed entities, and lifecycle hooks.

## Features ✨

-  👾 **Entity Management**: Easily add, remove, and update entities with components.
- 🧩 **Component-based Design**: Define entities using components for flexible entity composition.
- 😌 **Intuitive Design**: Easy to understand and master.
- 🪝 **Lifecycle Hooks**: Callbacks for entity addition and removal events.
- 🔎 **Query System**: Efficiently query entities based on component requirements.
- 😎 **Typescript Support**: Typescript is... coool!!

## Installation 📦
You can install Sword ECS via npm:

```bash
npm install sword-ecs
```

## Usage Example 🚀

### create a world 
```typescript
import { Sword } from 'sword-ecs';

// Initialize Sword ECS
const sword = new Sword();
```
### Define Entity Type
```typescript
// Define components
type PositionComponent = { x: number; y: number; };
type VelocityComponent = { dx: number; dy: number; };
type HealthComponent = {current: number, max: number};

type Entity = {
    position: PositionComponent,
    velocity: VelocityComponent,
    health: HealthComponent,
}
```

### Create and remove entities
```typescript

// Add entities to ECS
const player = sword.createEntity<Entity>({position: {x: 10, y: 10}});
const enemy = sword.createEntity<Entity>({
    position: {x: 10, y: 10},
    health: {max: 100, current: 100},
    velocity: {dx: 1, dy: 2}
});

sword.remove(enemy)
```

### Add & remove components to entities
```typescript
sword.addComponent(player, {health: {max: 100, current: 100}});

//remove a component
sword.removeComponent(player, 'health');
```

### Create a system
```typescript
// Define a system to update entity positions
function movementSystem(dt?: number) {
  const entities = sword.getEntitiesWithComponents('x', 'y', 'dx', 'dy').entities
  
  return function (dt: number) {
      for(let entity of entities) {
        entity.x += entity.dx * (dt || 1);
        entity.y += entity.dy * (dt || 1);
        sword.updateEntity(entity, { x: entity.x, y: entity.y });
      };
  }
};

// Add the system to ECS
sword.addSystem(movementSystem);

// Update ECS
const deltaTime = 0.1;
sword.update(deltaTime);
```

## Documentation 📚
Documentation is coming soon...

## Contributing 🤝
Contributions are welcome! Please check out the contribution guidelines.

## License 📄
This project is licensed under the MIT License - see the [LICENSE file](https://github.com/f-irac-odes/rep/edit/master/LICENSE.md) for details.
