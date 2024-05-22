import numpy as np
from ptype import Position
from math import cos, sin
# % Inputs:
# % F - applied forces vector [N]
# % m - mass of rocket [kg]
# % W - velocity about z body axis [m/s]
# % Q - pitch rate [ras/s] 
# % V - velocity about y body axis [m/s]
# % R - yaw rate [rad/s]
# % Outputs:

# % U_dot - derivative of velocity about x body axis [m/s^2]
# % M - Aerodynamic moment [N*m] 
# % I_x - moment of inertia Ix [kg*m^2]
# %

def Missile(t, y, control_input):
    
    
    # initialize the position of missile states
    def __init__(self):

        self.dt = 0.05        
        # mass 
        self.m = 100
        self.engine_able = True

    def update_engine(self,time):
        if time > 50:
            self.engine_able = False
    def thrust_force(self,u, p,delta_w_T, delta_k_T):
        
        T = 0.7*(58.4*2590+(0.4e6 - u[0])*0.278986)
        if self.engine_able is False:
            T = 0.0
        T_y = T*sin(delta_k_T)
        T_z = T*sin(delta_w_T)
        T_x = np.sqrt(T^2 - T_y^2 - T_z^2)
        return np.array([T_x, T_y, T_z ])
        
    def forces_on_the_object(self):
        gforce = self.gravity_foce(m,g,phi,theta)
        aeroforce = self.aerodynamic_force(pi, C_X0, rho, C_Na_ster, C_Na_kadl, alfa_t, C_Xa2, U, V, W, alfa, beta, delta_w, delta_k)
        thrustforce = self.thrust_force(u, p,delta_w_T, delta_k_T)
        F = gforce+ aeroforce+ thrustforce
        return F
        


    def aerodynamic_force(self,pi, C_X0, rho, C_Na_ster, C_Na_kadl, alfa_t, C_Xa2, U, V, W, alfa, beta, delta_w, delta_k):        
        R = np.zeros(3)
        S = pi*(0.92/2)^2
        Vaer_bezwzgl = np.sqrt(U^2 + V^2 + W^2)        
        P_x = (C_X0 + C_Xa2*sin(alfa_t)^2)*0.5*rho*Vaer_bezwzgl^2*S
        P_x_x = -P_x
        C_N_y = C_Na_kadl*sin(beta) + C_Na_ster*sin(beta+delta_k)
        C_N_z = C_Na_kadl*cos(beta)*sin(alfa) + C_Na_ster*cos(beta)*sin(alfa+delta_w)        
        P_N_y = -C_N_y*0.5*rho*Vaer_bezwzgl^2*S
        P_N_z = -C_N_z*0.5*rho*Vaer_bezwzgl^2*S

        R = np.array([P_x_x, P_N_y, P_N_z])
        return R


    def gravity_foce(self,m,g,phi,theta):
        Q = np.array([-m*g*sin(theta), m*g*cos(theta)*sin(phi), m*g*cos(theta)*cos(phi)])
        return Q
    

    def step(self,F,I):
        m = self.m

        U_dot = (F[0]+m*(R*V-Q*W))/m
        V_dot = (F[1]+m*(P*W-R*U))/m
        W_dot = (F[2]+m*(Q*U-P*V))/m
        P_dot = M[0]/I_x
        Q_dot = (M[1]+P*R*(I-I_x))/I
        R_dot = (M[2]+P*Q*(I_x-I))/I
        phi_dot = 0 #  % physical assumption  P + (Q*sin(phi)+R*cos(phi))*tan(theta);
        theta_dot = Q*cos(phi) - R*sin(phi)
        psi_dot = (Q*sin(phi) + R*cos(phi))/cos(theta)
        x_dot = U*cos(psi)*cos(theta) + V*(cos(psi)*sin(theta)*sin(phi)-sin(psi)*cos(phi)) + W*(cos(psi)*sin(theta)*cos(phi)+sin(psi)*sin(phi))
        y_dot = U*sin(psi)*cos(theta) + V*(sin(psi)*sin(theta)*sin(phi)+cos(psi)*cos(phi)) + W*(sin(psi)*sin(theta)*cos(phi)-cos(psi)*sin(phi))
        z_dot = -U*sin(theta) + V*cos(theta)*sin(phi) + W*cos(theta)*cos(phi)


    # Control input (thrust, angles, etc.)
    ux, uy, uz = control_input(t)

    
    # Define the ODEs (example dynamics)
    dxdt = vx
    dydt = vy
    dzdt = vz

    dvxdt = ux  # acceleration in x due to control input
    dvydt = uy  # acceleration in y due to control input
    dvzdt = uz  # acceleration in z due to control input and gravity



    def rungeKutta(x0, y0, x, h):
    # Count number of iterations using step size or
    # step height h
    n = (int)((x - x0)/h) 
    # Iterate for number of iterations
    y = y0
    for i in range(1, n + 1):
        "Apply Runge Kutta Formulas to find next value of y"
        k1 = h * dydx(x0, y)
        k2 = h * dydx(x0 + 0.5 * h, y + 0.5 * k1)
        k3 = h * dydx(x0 + 0.5 * h, y + 0.5 * k2)
        k4 = h * dydx(x0 + h, y + k3)
 
        # Update next value of y
        y = y + (1.0 / 6.0)*(k1 + 2 * k2 + 2 * k3 + k4)
 
        # Update next value of x
        x0 = x0 + h
    return y

    # Return the derivatives
    return [dxdt, dydt, dzdt, dvxdt, dvydt, dvzdt, ...]
