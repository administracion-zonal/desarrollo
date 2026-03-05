package com.administracionzonal.config;

import com.administracionzonal.security.JwtFilter;
import lombok.RequiredArgsConstructor;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.http.HttpMethod;

import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;

import org.springframework.security.config.http.SessionCreationPolicy;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import jakarta.servlet.http.HttpServletResponse;

import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtFilter jwtFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        http

            // desactivar csrf (API stateless)
            .csrf(csrf -> csrf.disable())

            // CORS
            .cors(cors -> {})

            // sin sesiones
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )

            // manejo de errores JWT
            .exceptionHandling(exception ->
                exception.authenticationEntryPoint((req, res, ex) ->
                    res.sendError(HttpServletResponse.SC_UNAUTHORIZED)
                )
            )

            .authorizeHttpRequests(auth -> auth

                /* =========================
                   ENDPOINTS PUBLICOS
                ========================= */

                .requestMatchers("/api/auth/**").permitAll()

                .requestMatchers("/api/public/**").permitAll()

                .requestMatchers("/api/usuarios/cedula/**").permitAll()

                .requestMatchers(HttpMethod.GET, "/uploads/**").permitAll()

                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()


                /* =========================
                   PERFIL USUARIO
                ========================= */

                .requestMatchers(HttpMethod.POST,
                        "/api/usuarios/subir-foto/**"
                ).authenticated()


                /* =========================
                   ADMIN
                ========================= */

                .requestMatchers("/api/admin/**")
                        .hasRole("ADMIN")


                /* =========================
                   RESERVAS ADMIN
                ========================= */

                .requestMatchers("/api/reservas/**")
                        .hasAnyRole("ADMIN", "SERVIDOR", "SERVIDOR_AZVCH")


                /* =========================
                   USUARIOS PRIVADOS
                ========================= */

                .requestMatchers("/api/privado/**")
                        .hasRole("PRIVADO")


                /* =========================
                   TODO LO DEMAS
                ========================= */

                .anyRequest().authenticated()
            )

            // filtro JWT
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /* =========================
       PASSWORD ENCODER
    ========================= */

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /* =========================
       CORS CONFIG
    ========================= */

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration config = new CorsConfiguration();

        config.setAllowedOrigins(
                List.of(
                        "http://localhost:5173",
                        "http://172.7.20.210",
                        "http://172.7.20.210:5173"
                )
        );

        config.setAllowedMethods(
                List.of("GET","POST","PUT","DELETE","OPTIONS")
        );

        config.setAllowedHeaders(List.of("*"));

        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/**", config);

        return source;
    }
}