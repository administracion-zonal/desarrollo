package com.administracionzonal.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {

    // ⚠️ mínimo 32 caracteres
    private static final String SECRET_KEY =
            "administracionzonal_super_secret_key_2026";

    private static final long EXPIRATION_MS = 1000 * 60 * 60 * 8; // 8 horas

    // ✅ ESTE MÉTODO SOLUCIONA EL ERROR getKey()
    private Key getKey() {
        return Keys.hmacShaKeyFor(SECRET_KEY.getBytes());
    }

    // ✅ ESTE MÉTODO SOLUCIONA EL ERROR generateToken()
    public String generateToken(String cedula, String rol) {
        return Jwts.builder()
                .setSubject(cedula)
                .claim("rol", rol)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_MS))
                .signWith(getKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String extractCedula(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getKey())
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }


    public String extractRole(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getKey())
                .build()
                .parseClaimsJws(token)
                .getBody()
                .get("rol", String.class);
    }


    public boolean isTokenValid(String token) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(getKey())
                    .build()
                    .parseClaimsJws(token);
            return true;
        } catch (JwtException e) {
            return false;
        }
    }
}
