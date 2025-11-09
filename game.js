// Phaser 3 Game Configuration
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#2d2d2d',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

// Game variables
let player;
let cursors;
let enemies;
let projectiles;
let gems;
let lastProjectileTime = 0;
let lastEnemySpawnTime = 0;
const PROJECTILE_COOLDOWN = 1000; // 1 second
const ENEMY_SPAWN_COOLDOWN = 2000; // 2 seconds
const PLAYER_SPEED = 200;
const ENEMY_SPEED = 100;
const PROJECTILE_SPEED = 300;
const WEAPON_RANGE = 250; // Only fire at enemies within this distance
const GEM_MAGNET_RADIUS = 100;
const GEM_MAGNET_SPEED = 200;

// Initialize the game
const game = new Phaser.Game(config);

function preload() {
    // No assets to preload - using emojis
}

function create() {
    // Create player
    player = this.add.text(400, 300, '🧑', { fontSize: '32px' });
    this.physics.add.existing(player);
    player.body.setCollideWorldBounds(true);
    player.body.setSize(32, 32);

    // Create groups for enemies, projectiles, and gems
    enemies = this.physics.add.group();
    projectiles = this.physics.add.group();
    gems = this.physics.add.group();

    // Setup keyboard controls
    cursors = this.input.keyboard.createCursorKeys();

    // Setup collisions
    this.physics.add.overlap(projectiles, enemies, hitEnemy, null, this);
    this.physics.add.overlap(player, gems, collectGem, null, this);
    this.physics.add.overlap(player, enemies, hitPlayer, null, this);

    // Store scene reference for use in other functions
    this.game.scene = this;
}

function update(time, delta) {
    // Player movement
    player.body.setVelocity(0);

    if (cursors.left.isDown) {
        player.body.setVelocityX(-PLAYER_SPEED);
    } else if (cursors.right.isDown) {
        player.body.setVelocityX(PLAYER_SPEED);
    }

    if (cursors.up.isDown) {
        player.body.setVelocityY(-PLAYER_SPEED);
    } else if (cursors.down.isDown) {
        player.body.setVelocityY(PLAYER_SPEED);
    }

    // Spawn enemies every 2 seconds
    if (time > lastEnemySpawnTime + ENEMY_SPAWN_COOLDOWN) {
        spawnEnemy(this);
        lastEnemySpawnTime = time;
    }

    // Fire projectile every 1 second
    if (time > lastProjectileTime + PROJECTILE_COOLDOWN) {
        fireProjectile(this);
        lastProjectileTime = time;
    }

    // Update enemies to move towards player
    enemies.children.entries.forEach(enemy => {
        const angle = Phaser.Math.Angle.Between(
            enemy.x, enemy.y,
            player.x, player.y
        );
        enemy.body.setVelocity(
            Math.cos(angle) * ENEMY_SPEED,
            Math.sin(angle) * ENEMY_SPEED
        );
    });

    // Update gems with magnet effect
    gems.children.entries.forEach(gem => {
        const distance = Phaser.Math.Distance.Between(
            gem.x, gem.y,
            player.x, player.y
        );

        if (distance < GEM_MAGNET_RADIUS) {
            const angle = Phaser.Math.Angle.Between(
                gem.x, gem.y,
                player.x, player.y
            );
            gem.body.setVelocity(
                Math.cos(angle) * GEM_MAGNET_SPEED,
                Math.sin(angle) * GEM_MAGNET_SPEED
            );
        } else {
            gem.body.setVelocity(0, 0);
        }
    });
}

function spawnEnemy(scene) {
    // Random spawn position just outside the screen
    const side = Phaser.Math.Between(0, 3);
    let x, y;

    switch(side) {
        case 0: // Top
            x = Phaser.Math.Between(0, 800);
            y = -32;
            break;
        case 1: // Right
            x = 832;
            y = Phaser.Math.Between(0, 600);
            break;
        case 2: // Bottom
            x = Phaser.Math.Between(0, 800);
            y = 632;
            break;
        case 3: // Left
            x = -32;
            y = Phaser.Math.Between(0, 600);
            break;
    }

    const enemy = scene.add.text(x, y, '👹', { fontSize: '32px' });
    scene.physics.add.existing(enemy);
    enemy.body.setSize(32, 32);
    enemies.add(enemy);
}

function fireProjectile(scene) {
    // Find closest enemy
    let closestEnemy = null;
    let closestDistance = Infinity;

    enemies.children.entries.forEach(enemy => {
        const distance = Phaser.Math.Distance.Between(
            player.x, player.y,
            enemy.x, enemy.y
        );
        if (distance < closestDistance) {
            closestDistance = distance;
            closestEnemy = enemy;
        }
    });

    // Only fire if there's an enemy within range
    if (closestEnemy && closestDistance <= WEAPON_RANGE) {
        const projectile = scene.add.text(player.x, player.y, '🔪', { fontSize: '24px' });
        scene.physics.add.existing(projectile);
        projectile.body.setSize(24, 24);

        // Calculate angle to closest enemy
        const angle = Phaser.Math.Angle.Between(
            player.x, player.y,
            closestEnemy.x, closestEnemy.y
        );

        projectile.body.setVelocity(
            Math.cos(angle) * PROJECTILE_SPEED,
            Math.sin(angle) * PROJECTILE_SPEED
        );

        projectiles.add(projectile);

        // Destroy projectile after 3 seconds if it doesn't hit anything
        scene.time.delayedCall(3000, () => {
            if (projectile && projectile.active) {
                projectile.destroy();
            }
        });
    }
}

function hitEnemy(projectile, enemy) {
    // Destroy both projectile and enemy
    const gemX = enemy.x;
    const gemY = enemy.y;

    projectile.destroy();
    enemy.destroy();

    // Drop a gem at enemy's location
    const gem = this.add.text(gemX, gemY, '💎', { fontSize: '24px' });
    this.physics.add.existing(gem);
    gem.body.setSize(24, 24);
    gems.add(gem);
}

function collectGem(player, gem) {
    console.log('XP collected!');
    gem.destroy();
}

function hitPlayer(player, enemy) {
    console.log('Game Over!');
    // For now, just log the message
    // In a full implementation, you might want to pause the game or show a game over screen
}
