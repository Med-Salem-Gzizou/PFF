#!/usr/bin/python

import RPi.GPIO as GPIO
import time

class DriverMotor:
    DIRECTION_0 = 0
    DIRECTION_1 = 1
    DIRECTION_2 = -1

    positionCode = 0
    targetPositionCode = 0
    rotationDirection = DIRECTION_0

    hitTargetPosition = True

    def setPositionCode(self, posCode):
        self.hitTargetPosition = False
        self.targetPositionCode = posCode
        self.adjustPosition()

    def adjustPosition(self):
        if self.positionCode > self.targetPositionCode:
            self.rotationDirection = self.DIRECTION_1
            GPIO.output(self.out_pin_pwm, 1)
            GPIO.output(self.out_pin_direction_1, 1)
            GPIO.output(self.out_pin_direction_2, 0)

        elif self.positionCode < self.targetPositionCode:
            self.rotationDirection = self.DIRECTION_2
            GPIO.output(self.out_pin_pwm, 1)
            GPIO.output(self.out_pin_direction_1, 0)
            GPIO.output(self.out_pin_direction_2, 1)

        else:
            GPIO.output(self.out_pin_pwm, 0)
            GPIO.output(self.out_pin_direction_1, 0)
            GPIO.output(self.out_pin_direction_2, 0)
            self.hitTargetPosition = True

    def detectPosition_callback(self, channel):
        positionDiff = abs( self.positionCode - self.targetPositionCode )
        print "[", self.positionCode, "] =>  [", self.targetPositionCode, "]"

        if self.rotationDirection == self.DIRECTION_1:
            self.positionCode -= 1
        elif self.rotationDirection == self.DIRECTION_2:
            self.positionCode += 1

        if self.positionCode == self.targetPositionCode:
            self.adjustPosition()

    def __init__(self):
        self.in_pin_encoder_1 = 21
        self.out_pin_direction_1 = 19
        self.out_pin_direction_2 = 16
        self.out_pin_pwm = 6
        #setup pins
        GPIO.setmode(GPIO.BCM)
        GPIO.setup(self.in_pin_encoder_1, GPIO.IN, pull_up_down=GPIO.PUD_DOWN)
        GPIO.setup(self.out_pin_direction_1, GPIO.OUT, initial=GPIO.LOW)
        GPIO.setup(self.out_pin_direction_2, GPIO.OUT, initial=GPIO.LOW)
        GPIO.setup(self.out_pin_pwm, GPIO.OUT, initial=GPIO.LOW)
        #detect encoder Change
        GPIO.add_event_detect(self.in_pin_encoder_1, GPIO.RISING, callback=self.detectPosition_callback)

    def cleanExit(self):
        print "clean exit"
        self.setPositionCode(0)
        while not(self.hitTargetPosition):
            time.sleep(0.1)
        GPIO.cleanup()

if __name__ == "__main__":
    Driver = DriverMotor()

    import atexit
    atexit.register(Driver.cleanExit)

    userCommand = raw_input('target position :')
    while userCommand != 'e' :
        try:
            targetPosition = int(userCommand)
        except:
            targetPosition = 0

        Driver.setPositionCode(targetPosition)
        userCommand = raw_input('target position :')
