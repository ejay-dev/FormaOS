package com.formaos.utils;

import java.io.FileInputStream;
import java.io.IOException;
import java.util.Properties;

public class ConfigReader {
    private Properties properties;
    
    public ConfigReader() {
        try {
            FileInputStream fis = new FileInputStream("config.properties");
            properties = new Properties();
            properties.load(fis);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
    
    public String getBaseUrl() {
        return properties.getProperty("base.url");
    }
    
    public String getBrowser() {
        return properties.getProperty("browser", "chrome");
    }
    
    public boolean isHeadless() {
        return Boolean.parseBoolean(properties.getProperty("headless", "false"));
    }
    
    public int getImplicitWait() {
        return Integer.parseInt(properties.getProperty("implicit.wait", "10"));
    }
    
    public int getExplicitWait() {
        return Integer.parseInt(properties.getProperty("explicit.wait", "20"));
    }
    
    public int getPageLoadTimeout() {
        return Integer.parseInt(properties.getProperty("page.load.timeout", "30"));
    }
}
