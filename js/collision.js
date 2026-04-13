// ============================================
// DRONES PANDAVEN 3D — Collision System (FPS)
// ============================================
class CollisionSystem {
    spheresIntersect(x1,y1,z1,r1,x2,y2,z2,r2) {
        return (x2-x1)**2+(y2-y1)**2+(z2-z1)**2 < (r1+r2)**2;
    }
    sphereBox(sx,sy,sz,sr, bx,by,bz,bw,bh,bd) {
        const cx=clamp(sx,bx-bw/2,bx+bw/2);
        const cy=clamp(sy,by-bh/2,by+bh/2);
        const cz=clamp(sz,bz-bd/2,bz+bd/2);
        return (sx-cx)**2+(sy-cy)**2+(sz-cz)**2 < sr*sr;
    }
    // Check projectile against player (sphere-sphere)
    projectileHitsPlayer(proj, player) {
        if(!proj.active || !player.alive) return false;
        return this.spheresIntersect(
            proj.x, proj.y, proj.z, proj.radius,
            player.x, player.y, player.z, player.radius
        );
    }
    // Check projectile against EMP shield
    projectileHitsShield(proj, player) {
        if(!proj.active || !player.empShieldActive) return false;
        return this.spheresIntersect(
            proj.x, proj.y, proj.z, proj.radius,
            player.x, player.y, player.z, CONFIG.EMP_SHIELD_RADIUS
        );
    }
    // Distance check
    distanceBetween(x1,y1,z1,x2,y2,z2) {
        return Math.sqrt((x2-x1)**2+(y2-y1)**2+(z2-z1)**2);
    }
}
