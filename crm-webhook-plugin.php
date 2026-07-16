<?php
/**
 * Plugin Name: CRM Webhook Connector
 * Description: Conecta formularios Elementor al CRM Tu Hipoteca Fácil
 * Version: 1.0.0
 * Author: Tu Hipoteca Fácil
 */

// Evitar acceso directo
if (!defined('ABSPATH')) exit;

class CRM_Webhook_Connector {
    
    private $webhook_url = 'https://tuhuipotecafacil-crm2026-sitiosdigitales.vercel.app/api/webhook/leads';
    
    public function __construct() {
        add_action('elementor_pro/forms/actions/submission', array($this, 'handle_elementor_form'), 10, 2);
    }
    
    public function handle_elementor_form($action, $form_data) {
        // Obtener los campos del formulario
        $form_name = $form_data['form_name'];
        
        // Mapear campos del formulario a campos del CRM
        $crm_data = array(
            'Nombre' => $this->get_field_value($form_data, 'Nombre', 'nombre', 'name'),
            'Apellido' => $this->get_field_value($form_data, 'Apellido', 'apellido', 'last_name'),
            'Rut' => $this->get_field_value($form_data, 'Rut', 'rut', 'rut'),
            'email' => $this->get_field_value($form_data, 'Correo Electrónico', 'email', 'email'),
            'telefono' => $this->get_field_value($form_data, 'Número de Teléfono', 'telefono', 'phone'),
        );
        
        // Enviar al CRM
        $this->send_to_crm($crm_data);
    }
    
    private function get_field_value($form_data, ...$field_names) {
        foreach ($field_names as $name) {
            if (isset($form_data['response'][$name])) {
                return $form_data['response'][$name];
            }
        }
        return '';
    }
    
    private function send_to_crm($data) {
        $args = array(
            'method' => 'POST',
            'timeout' => 30,
            'headers' => array(
                'Content-Type' => 'application/json',
            ),
            'body' => json_encode($data),
        );
        
        $response = wp_remote_post($this->webhook_url, $args);
        
        if (is_wp_error($response)) {
            error_log('CRM Webhook Error: ' . $response->get_error_message());
        }
    }
}

// Iniciar el plugin
new CRM_Webhook_Connector();
