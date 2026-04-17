package com.parkingapp.security;

import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * Utility class for generating and validating JSON Web Tokens.
 * Updated for JJWT 0.12.x API.
 */
@Component
public class JwtTokenProvider {

    private final SecretKey signingKey;
    private final long expirationMs;

    public JwtTokenProvider(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration-ms:86400000}") long expirationMs) {

        // In JJWT 0.12, Keys.hmacShaKeyFor returns a SecretKey.
        // Make sure your application.properties secret is AT LEAST 32 characters long!
        this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    public String generateToken(Authentication authentication) {
        String email = authentication.getName();
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .subject(email)      // Replaces setSubject()
                .issuedAt(now)       // Replaces setIssuedAt()
                .expiration(expiry)  // Replaces setExpiration()
                .signWith(signingKey) // Auto-detects the correct HMAC algorithm (HS256+) based on key size
                .compact();
    }

    public String getEmailFromToken(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)     // Replaces setSigningKey()
                .build()
                .parseSignedClaims(token)   // Replaces parseClaimsJws()
                .getPayload()               // Replaces getBody()
                .getSubject();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(signingKey)
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            // Note: In production, you might want to log 'e.getMessage()' here
            // so you can see if it expired, was malformed, or had a bad signature.
            return false;
        }
    }
}