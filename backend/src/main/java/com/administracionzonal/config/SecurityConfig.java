package com.administracionzonal.config;

import com.administracionzonal.security.JwtFilter;
import lombok.RequiredArgsConstructor;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;


@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtFilter jwtFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

    http
        .csrf(csrf -> csrf.disable())
        .cors(cors -> {})
        .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(auth -> auth

            // 🔥 permitir acceso a uploads SIN autenticación
            .requestMatchers(org.springframework.http.HttpMethod.GET, "/uploads/**").permitAll()

            // permitir subir foto
            .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/usuarios/subir-foto/**").permitAll()


            // permitir auth y públicos
            .requestMatchers("/api/auth/**").permitAll()
            .requestMatchers("/api/public/**").permitAll()
            .requestMatchers("/areas/**").permitAll()
.requestMatchers("/api/usuarios/cedula/**").permitAll()


            // permitir OPTIONS
            .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()

            // tus reglas existentes
            .requestMatchers("/api/admin/**").authenticated()
            .requestMatchers("/api/reservas/**").hasRole("ADMIN")
            .requestMatchers("/api/privado/**").hasRole("PRIVADO")

            .anyRequest().authenticated()
        )
        .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

    return http.build();
}

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // 🔥 ORIGEN EXACTO DE REACT
        config.setAllowedOrigins(
            List.of("http://localhost:5173")
        );

        config.setAllowedMethods(
            List.of("GET", "POST", "PUT", "DELETE", "OPTIONS")
        );

        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/**", config);
        return source;
    }

}
