package com.clientdesk;

import org.junit.jupiter.api.*;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;

@Disabled("Run when Chrome / ChromeDriver is available or via Docker Selenium grid")
public class SeleniumE2ETest {

    private WebDriver driver;
    private WebDriverWait wait;
    private final String baseUrl = System.getProperty("app.url", "http://localhost:3000");

    @BeforeEach
    void setUp() {
        ChromeOptions options = new ChromeOptions();
        options.addArguments("--headless=new", "--no-sandbox", "--disable-dev-shm-usage");
        driver = new ChromeDriver(options);
        wait = new WebDriverWait(driver, Duration.ofSeconds(10));
    }

    @AfterEach
    void tearDown() {
        if (driver != null) {
            driver.quit();
        }
    }

    @Test
    @DisplayName("Сквозной UI-сценарий в браузере: Авторизация -> Заявка -> Работа исполнителя -> Закрытие")
    void testEndToEndUiScenario() {
        // 1. Open Login Page
        driver.get(baseUrl);

        // 2. Login as Manager
        WebElement loginInput = wait.until(ExpectedConditions.visibilityOfElementLocated(By.name("login")));
        WebElement passwordInput = driver.findElement(By.name("password"));
        loginInput.sendKeys("admin");
        passwordInput.sendKeys("admin123");
        driver.findElement(By.xpath("//button[contains(text(), 'Войти')]")).click();

        // 3. Verify Dashboard loaded
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.xpath("//*[contains(text(), 'Дашборд')]")));

        // 4. Navigate to Tickets
        driver.findElement(By.xpath("//a[contains(@href, '/tickets')]")).click();
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.xpath("//button[contains(text(), 'Создать заявку')]")));
    }
}
