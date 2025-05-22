// ... các include và cấu hình ban đầu như cũ ...
#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include <DHT.h>
#include <OneWire.h>
#include <DallasTemperature.h>

#define WIFI_SSID "A09.18"
#define WIFI_PASSWORD "12345678!"

#define API_KEY "XteG2K529di1fNFX41zwKAm4GkCMyKYYjuOiOqBU"
#define DATABASE_URL "https://hoca-20466-default-rtdb.asia-southeast1.firebasedatabase.app"

#define DHTPIN 4
#define DHTTYPE DHT11
#define ONE_WIRE_BUS 15
#define PHAO_PIN 16
#define RELAY1_PIN 17
#define RELAY2_PIN 18

FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;
DHT dht(DHTPIN, DHTTYPE);
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);

unsigned long lastSensorRead = 0;
const unsigned long SENSOR_INTERVAL = 3000;
bool firebaseReady = false;

void setup() {
  Serial.begin(115200);
  initializePins();
  connectToWiFi();
  initializeSensors();
  configureFirebase();
}

void loop() {
  if (millis() - lastSensorRead >= SENSOR_INTERVAL) {
    readAndSendSensorData();
    readAndControlRelays();
    lastSensorRead = millis();
  }
  delay(100);
}

void initializePins() {
  pinMode(PHAO_PIN, INPUT_PULLUP);
  pinMode(RELAY1_PIN, OUTPUT);
  pinMode(RELAY2_PIN, OUTPUT);
  digitalWrite(RELAY1_PIN, LOW);
  digitalWrite(RELAY2_PIN, LOW);
}

void connectToWiFi() {
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi Failed. Restarting...");
    delay(5000);
    ESP.restart();
  }
  Serial.println("WiFi connected.");
}

void initializeSensors() {
  dht.begin();
  sensors.begin();
}

void configureFirebase() {
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;
  config.signer.tokens.legacy_token = API_KEY;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
  delay(1000);
  if (Firebase.RTDB.getInt(&fbdo, "/test")) {
    firebaseReady = true;
    Serial.println("Firebase ready");
  } else {
    firebaseReady = true;
    Serial.println("Firebase ready (but test read failed)");
  }
}

void readAndSendSensorData() {
  // Random dữ liệu cho test
  float temperature = random(200, 350) / 10.0;  // 20.0 - 35.0 độ C
  float humidity = random(400, 800) / 10.0;     // 40.0% - 80.0%
  float waterTemp = random(180, 300) / 10.0;    // 18.0 - 30.0 độ C
  bool waterDetected = random(0, 2) == 1;       // true hoặc false ngẫu nhiên

  FirebaseJson json;
  json.set("temperature", temperature);
  json.set("humidity", humidity);
  json.set("waterTemperature", waterTemp);
  json.set("waterDetected", waterDetected);
  json.set("phaoState", waterDetected ? 1 : 0);
  json.set("timestamp", millis());
  json.set("uptime", millis() / 1000);
  json.set("wifi_rssi", WiFi.RSSI());
  json.set("free_heap", ESP.getFreeHeap());

  if (firebaseReady) {
    for (int i = 0; i < 3; i++) {
      if (Firebase.RTDB.setJSON(&fbdo, "/sensor_data", &json)) {
        Serial.println("Data sent to Firebase");
        break;
      } else {
        Serial.printf("Send failed: %s\n", fbdo.errorReason().c_str());
        delay(1000);
      }
    }
  }
}


void readAndControlRelays() {
  if (!firebaseReady) return;

  // Relay 1
  if (Firebase.RTDB.getInt(&fbdo, "/relay1")) {
    if (fbdo.dataType() == "int") {
      int state = fbdo.intData();
      digitalWrite(RELAY1_PIN, state == 1 ? HIGH : LOW);
      Serial.printf("Relay 1: %s\n", state == 1 ? "ON" : "OFF");
    } else {
      Serial.println("relay1 is not an int");
    }
  } else {
    Serial.printf("Read relay1 failed: %s\n", fbdo.errorReason().c_str());
  }

  // Relay 2
  if (Firebase.RTDB.getInt(&fbdo, "/relay2")) {
    if (fbdo.dataType() == "int") {
      int state = fbdo.intData();
      digitalWrite(RELAY2_PIN, state == 1 ? HIGH : LOW);
      Serial.printf("Relay 2: %s\n", state == 1 ? "ON" : "OFF");
    } else {
      Serial.println("relay2 is not an int");
    }
  } else {
    Serial.printf("Read relay2 failed: %s\n", fbdo.errorReason().c_str());
  }
}

