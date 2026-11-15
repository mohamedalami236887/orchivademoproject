package com.orchiva.workflow.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfiguration {

    @Bean
    OpenAPI orchivaOpenApi() {
        return new OpenAPI().info(new Info()
                .title("Orchiva API")
                .description("REST API for the Orchiva enterprise workflow and document management platform")
                .version("v1")
                .contact(new Contact().name("Orchiva Engineering")));
    }
}
