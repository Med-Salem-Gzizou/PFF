package com.example.medsalem.pff_app;

import android.content.Intent;
import android.net.Uri;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;

public class MainActivity extends AppCompatActivity {

    Button button_tcp_ON;
    Button button_tcp_OFF;
    Button set_password_button;

    Button online_url_button;
    Button local_url_button;

    TextView tcp_message_textView;
    EditText element_password;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        tcp_message_textView = (TextView) findViewById(R.id.tcp_message_textView);

        element_password = (EditText) findViewById(R.id.element_password);

        final TcpClient mClient = new TcpClient("192.168.4.1", 80, "0000000000");

        set_password_button = (Button) findViewById(R.id.set_password_button);
        set_password_button.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Log.i("main activity", "set new pass:" + String.valueOf(element_password.getText()));
                mClient.serverPassword = String.valueOf(element_password.getText());
            }
        });


        button_tcp_ON = (Button) findViewById(R.id.tcp_on_button);
        button_tcp_ON.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                new Thread(new Runnable() {
                    @Override
                    public void run() {
                        Log.i("main activity", "button 1 clicked");
                        tcp_message_textView.post(new Runnable() {
                            @Override
                            public void run() {
                                tcp_message_textView.setText("Connecting ...");
                            }
                        });
                        final String tcpResponce = mClient.sendONCommand();
                        Log.i("main activity", "tcp responce :"+ tcpResponce);
                        tcp_message_textView.post(new Runnable() {
                            @Override
                            public void run() {
                                tcp_message_textView.setText(tcpResponce);
                            }
                        });
                    }
                }).start();

            }
        });

        button_tcp_OFF = (Button) findViewById(R.id.tcp_off_button);
        button_tcp_OFF.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                new Thread(new Runnable() {
                    @Override
                    public void run() {
                        Log.i("main activity", "button 2 clicked");
                        tcp_message_textView.post(new Runnable() {
                            @Override
                            public void run() {
                                tcp_message_textView.setText("Connecting ...");
                            }
                        });
                        final String tcpResponce = mClient.sendOFFCommand();
                        Log.i("main activity", "tcp responce :"+ tcpResponce);
                        tcp_message_textView.post(new Runnable() {
                            @Override
                            public void run() {
                                tcp_message_textView.setText(tcpResponce);
                            }
                        });
                    }
                }).start();
            }
        });

        online_url_button = (Button) findViewById(R.id.online_url_button);
        online_url_button.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Log.i("main activity", "online button clicked !");
                Uri uri = Uri.parse("https://pff-server.herokuapp.com/");
                Intent intent = new Intent(Intent.ACTION_VIEW, uri);
                startActivity(intent);
            }
        });

        local_url_button = (Button) findViewById(R.id.local_url_button);
        local_url_button.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Log.i("main activity", "local url button clicked !");
                Uri uri = Uri.parse("http://192.168.42.1/v2");
                Intent intent = new Intent(Intent.ACTION_VIEW, uri);
                startActivity(intent);
            }
        });
    }
}
