package com.administracionzonal.config;

import java.util.List;

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

import com.administracionzonal.security.JwtFilter;

import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

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
                                .cors(cors -> {
                                })

                                // sin sesiones
                                .sessionManagement(session -> session
                                                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                                // manejo de errores JWT
                                .exceptionHandling(exception -> exception
                                                .authenticationEntryPoint((req, res, ex) -> res
                                                                .sendError(HttpServletResponse.SC_UNAUTHORIZED)))

                                .authorizeHttpRequests(auth -> auth

                                                /*
                                                 * =========================
                                                 * ENDPOINTS PUBLICOS
                                                 * =========================
                                                 */

                                                .requestMatchers(
                                                                "/favicon.ico",
                                                                "/error",
                                                                "/",
                                                                "/index.html")
                                                .permitAll()

                                                .requestMatchers("/usuarios/aceptar-acuerdo")
                                                .authenticated()

                                                .requestMatchers("/auth/**").permitAll()

                                                .requestMatchers("/public/**").permitAll()

                                                .requestMatchers("/usuarios/cedula/**").permitAll()

                                                .requestMatchers("/uploads/**").permitAll()

                                                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                                                /*
                                                 * =========================
                                                 * CANCHA
                                                 * =========================
                                                 */

                                                .requestMatchers("/api/cancha/disponibilidad").permitAll()

                                                // usuarios
                                                .requestMatchers("/api/cancha").authenticated()
                                                .requestMatchers("/api/cancha/mis").authenticated()

                                                // admin
                                                .requestMatchers(HttpMethod.POST, "/api/cancha/todas").hasRole("ADMIN")
                                                .requestMatchers(HttpMethod.GET, "/api/cancha/validar").hasRole("ADMIN")

                                                /*
                                                 * =========================
                                                 * VEHICULOS
                                                 * =========================
                                                 */

                                                .requestMatchers("/api/vehiculos/choferes").permitAll() // 👈 AQUI

                                                .requestMatchers("/api/vehiculos/solicitudes/**")
                                                .hasAnyRole("SERVIDOR_AZVCH", "ADMIN", "ADMIN_VEHICULOS")

                                                .requestMatchers("/api/vehiculos/**")
                                                .hasAnyRole("SERVIDOR_AZVCH", "ADMIN")

                                                // crear reserva (usuarios normales)
                                                .requestMatchers(HttpMethod.POST, "/api/vehiculos/reservar")
                                                .hasAnyRole("SERVIDOR_AZVCH", "ADMIN")

                                                // ver mis reservas
                                                .requestMatchers(HttpMethod.GET, "/api/vehiculos/mis")
                                                .hasAnyRole("SERVIDOR_AZVCH", "ADMIN")

                                                // admin gestiona todo
                                                .requestMatchers("/api/vehiculos/admin/**")
                                                .hasRole("ADMIN")

                                                // chofer
                                                .requestMatchers("/api/vehiculos/chofer/**")
                                                .hasAnyRole("SERVIDOR_AZVCH", "ADMIN")

                                                .requestMatchers("/api/vehiculos/admin/salvoconducto/**")
                                                .hasRole("ADMIN")

                                                .requestMatchers("/api/vehiculos/solicitudes/pendientes")
                                                .hasRole("ADMIN")

                                                .requestMatchers("/api/vehiculos/solicitudes/*/aprobar")
                                                .hasRole("ADMIN")

                                                .requestMatchers("/api/vehiculos/solicitudes/*/rechazar")
                                                .hasRole("ADMIN")

                                                /*
                                                 * =========================
                                                 * TALENTO HUMANO (CORREGIDO)
                                                 * =========================
                                                 */

                                                // público
                                                .requestMatchers("/api/talento-humano/proceso-pendiente/**").permitAll()

                                                // crear usuario (solo TH)
                                                .requestMatchers("/api/talento-humano/crear-o-activar")
                                                .hasRole("TALENTO_HUMANO")

                                                // subir documentos
                                                .requestMatchers(HttpMethod.POST,
                                                                "/api/talento-humano/documento/upload")
                                                .hasRole("SERVIDOR_AZVCH")

                                                // listar documentos
                                                .requestMatchers(HttpMethod.GET, "/api/talento-humano/documentos/**")
                                                .hasAnyRole("SERVIDOR_AZVCH", "TALENTO_HUMANO", "ADMIN")

                                                // finalizar proceso
                                                .requestMatchers("/api/talento-humano/proceso/finalizar")
                                                .hasRole("SERVIDOR_AZVCH")

                                                // resto autenticados
                                                .requestMatchers("/api/talento-humano/**")
                                                .hasAnyRole("SERVIDOR_AZVCH", "TALENTO_HUMANO", "ADMIN")

                                                /*
                                                 * =========================
                                                 * PERFIL USUARIO
                                                 * =========================
                                                 */

                                                .requestMatchers(HttpMethod.POST,
                                                                "/usuarios/subir-foto/**")
                                                .authenticated()

                                                /*
                                                 * =========================
                                                 * ADMIN
                                                 * =========================
                                                 */

                                                .requestMatchers("/api/admin/**")
                                                .hasRole("ADMIN")

                                                /*
                                                 * =========================
                                                 * RESERVAS (USUARIOS LOGUEADOS)
                                                 * =========================
                                                 */

                                                // públicos
                                                .requestMatchers("/api/reservas/disponibilidad").permitAll()

                                                // usuario normal
                                                .requestMatchers("/api/reservas/mis").authenticated()
                                                .requestMatchers("/api/reservas/*/cancelar").authenticated()

                                                // ADMIN_COWORKING
                                                .requestMatchers("/api/reservas/todas").hasRole("ADMIN_COWORKING")
                                                .requestMatchers("/api/reservas/validar-qr/**")
                                                .hasRole("ADMIN_COWORKING")
                                                .requestMatchers("/api/reservas/*/asistir").hasRole("ADMIN_COWORKING")

                                                // fallback (importante al final)
                                                .requestMatchers("/api/reservas/**").hasRole("ADMIN_COWORKING")

                                                /*
                                                 * =========================
                                                 * USUARIOS PRIVADOS
                                                 * =========================
                                                 */

                                                .requestMatchers("/api/privado/**")
                                                .hasRole("PRIVADO")

                                                .anyRequest().authenticated())

                                // filtro JWT
                                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

                return http.build();
        }

        /*
         * =========================
         * PASSWORD ENCODER
         * =========================
         */

        @Bean
        public PasswordEncoder passwordEncoder() {
                return new BCryptPasswordEncoder();
        }

        /*
         * =========================
         * CORS CONFIG
         * =========================
         */

        @Bean
        public CorsConfigurationSource corsConfigurationSource() {

                CorsConfiguration config = new CorsConfiguration();

                config.setAllowedOrigins(
                                List.of(
                                                "http://localhost:5173", "http://172.20.7.9:5173"));

                config.setAllowedMethods(
                                List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));

                config.setAllowedHeaders(List.of("*"));

                config.setAllowCredentials(true);

                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();

                source.registerCorsConfiguration("/**", config);

                return source;
        }
}