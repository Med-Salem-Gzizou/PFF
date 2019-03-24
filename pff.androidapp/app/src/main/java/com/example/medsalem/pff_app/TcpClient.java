package com.example.medsalem.pff_app;

/**
 * Created by medsalem on 4/26/17.
 */

import java.net.*;
import java.io.*;

public class TcpClient {

    public String serverIp = "192.168.2.5";
    public int serverPort = 4444;
    public String serverPassword = "0000000000";

    public TcpClient(String ip, int port, String passWord){
        serverIp = ip;
        serverPort = port;
        serverPassword = passWord;
    }

    public String sendString(String msg){
        String msgCommand = msg;
        String serverResponce = "";
        try {
            Socket clientSocket = new Socket(serverIp, serverPort);

            OutputStream outToServer = clientSocket.getOutputStream();
            DataOutputStream out = new DataOutputStream(outToServer);

            InputStream inFromServer = clientSocket.getInputStream();
            DataInputStream in = new DataInputStream(inFromServer);

            out.writeBytes(msgCommand);
            serverResponce = in.readLine();

            clientSocket.close();
        }catch(IOException e){
            e.printStackTrace();
        }
        return serverResponce;
    }

    public String sendONCommand(){
        String msgCommand = serverPassword + "/LED=ON\n";
        String serverResponce = "";
        try {
            Socket clientSocket = new Socket(serverIp, serverPort);

            OutputStream outToServer = clientSocket.getOutputStream();
            DataOutputStream out = new DataOutputStream(outToServer);

            InputStream inFromServer = clientSocket.getInputStream();
            DataInputStream in = new DataInputStream(inFromServer);

            out.writeBytes(msgCommand);
            serverResponce = in.readLine();

            clientSocket.close();
        }catch(IOException e){
            e.printStackTrace();
        }
        return serverResponce;
    }

    public String sendOFFCommand(){
        String msgCommand = serverPassword + "/LED=OFF\n";
        String serverResponce = "";
        try {
            Socket clientSocket = new Socket(serverIp, serverPort);

            OutputStream outToServer = clientSocket.getOutputStream();
            DataOutputStream out = new DataOutputStream(outToServer);

            InputStream inFromServer = clientSocket.getInputStream();
            DataInputStream in = new DataInputStream(inFromServer);

            out.writeBytes(msgCommand);
            serverResponce = in.readLine();

            clientSocket.close();
        }catch(IOException e){
            e.printStackTrace();
        }
        return serverResponce;
    }

}