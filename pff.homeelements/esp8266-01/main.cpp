#include <ESP8266WiFi.h>
#include <MQTTClient.h>

const char* elementId = "0001";
const char* elementPass = "0000000000";

const char* ssid = "PiHome";
const char* password = "raspberry";

const char* mqttBrocker = "192.168.42.1";
int mqttConnectionStatu = 0;

int outPin = 2; // GPIO2
int inPin  = 0;

int value = LOW;
int mqttValue = LOW;

const char* commandTopic = "/elements/command/0001";
const char* statusTopic = "/elements/status/0001";
const char* statusHIGH = "HIGH";
const char* statusLOW = "LOW";
WiFiServer server(80);
WiFiClient net;
MQTTClient mqttClient;

void setup() {
  Serial.begin(115200);
  delay(10);

  pinMode(inPin, INPUT);
  pinMode(outPin, OUTPUT);
  digitalWrite(outPin, HIGH); // outpin value inversed

  // Connect to WiFi network
  Serial.print("\n\ntest 3 begin: ");

  // Start the server
  server.begin();
  Serial.println("Server started");
  delay(10);

  // Connect to wif ap and mqtt brocker
  WiFi.begin(ssid, password);
  mqttClient.begin(mqttBrocker, net);

}

void loop() {
  delay(500);
  Serial.print(".");

  // chek input pin status
  if(digitalRead(inPin) == LOW){

    Serial.println("change statu");
    if(value == LOW){
      digitalWrite(outPin, LOW); // turn on led
      value = HIGH;
    }else{
      digitalWrite(outPin, HIGH); // turn off led
      value = LOW;
    }

    do{ delay(2); }while(digitalRead(inPin) == LOW);
  }

  // Chek wifi and mqtt connection /////////////////////////////////////////////
  if(WiFi.status() == WL_CONNECTED){
    if( mqttClient.connected() ){
      if(mqttConnectionStatu == 0){
        mqttClient.subscribe(commandTopic);
        if(value == HIGH){ mqttClient.publish(statusTopic, statusHIGH); }
        else{ mqttClient.publish(statusTopic, statusLOW); }
        mqttConnectionStatu = 1;
      }
      mqttClient.loop();
      delay(10);

      if( value != mqttValue ){
        if(value == HIGH){ mqttClient.publish(statusTopic, statusHIGH); }
        else{ mqttClient.publish(statusTopic, statusLOW); }
        mqttValue = value;
      }
    }else{
      mqttConnectionStatu = 0;
      mqttClient.connect(elementId, elementId, elementPass);
      Serial.print(":");
    }
  }

  // Check if a client has connected to tcp port ///////////////////////////////
  WiFiClient tcpClient = server.available();
  if (tcpClient) {
    Serial.println("new client");

    if(tcpClient.available()){
      // Read the first line of the request
      String request = tcpClient.readStringUntil('\n');
      Serial.println(request);
      tcpClient.flush();

      // Match the request
      if (request.indexOf(elementPass) == 0){  // sheck esp key
        if (request.indexOf("/LED=ON") == 10) {
          digitalWrite(outPin, LOW); // turn on led
          value = HIGH;
        }
        if (request.indexOf("/LED=OFF") == 10){
          digitalWrite(outPin, HIGH); // turn off led
          value = LOW;
        }
      }

      // Return the response
      tcpClient.print("Led pin is now: ");
      if(value == HIGH) { tcpClient.println("On"); }
      else { tcpClient.println("Off"); }

      tcpClient.println("/LED=ON  turn the LED on pin 2 ON");
      tcpClient.println("/LED=OFF turn the LED on pin 2 OFF");
    }
    delay(1);
    Serial.println("Client disonnected");
    Serial.println("");
  }

  return;
}


void messageReceived(String topic, String payload, char * bytes, unsigned int length) {
  Serial.print("incoming: ");
  Serial.print(topic);
  Serial.print(" - ");
  Serial.print(payload);
  Serial.println();
  if(payload == statusLOW){
    digitalWrite(outPin, HIGH); // turn off led
    value = LOW;
  }
  if(payload == statusHIGH){
    digitalWrite(outPin, LOW); // turn on led
    value = HIGH;
  }
}
