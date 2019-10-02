class Camera{
    viewDirection = glMatrix.vec3.create();
    UP = glMatrix.vec3.create();
    positionVector = glMatrix.vec3.fromValues(0.0, 0.0, 0.0);
    matrix = glMatrix.mat4.create();
    angle;

    constructor(){
        this.viewDirection = glMatrix.vec3.fromValues(0.0, 0.0, -1.0);
        this.UP = glMatrix.vec3.fromValues(0.0, 1.0, 0.0);
        this.angle = 0.0;
    }

    // 0 = move back, 1 = move forward, 2 = move down, 3 = move up, 4 = move left, 5 = move right
    move(operation, scaleFactor){
        let amtToMove = glMatrix.vec3.fromValues(0.0, 0.0, 0.0);
        let scaleMovement = scaleFactor;
        let moveView = glMatrix.vec3.create();

        if(operation < 2){
            glMatrix.vec3.scale(amtToMove, this.viewDirection, scaleMovement);
            if (operation == 0)
                glMatrix.vec3.sub(this.positionVector, this.positionVector, amtToMove);
            else if(operation == 1)
                glMatrix.vec3.add(this.positionVector, this.positionVector, amtToMove);
            }
        else if(operation < 4){
            glMatrix.vec3.scale(amtToMove, this.UP, scaleMovement);
            if(operation == 2)
                glMatrix.vec3.sub(this.positionVector, this.positionVector, amtToMove);
            else if(operation == 3)
                glMatrix.vec3.add(this.positionVector, this.positionVector, amtToMove);
        }
        else{
            let moveDir = glMatrix.vec3.create();
            glMatrix.vec3.cross(moveDir, this.viewDirection, this.UP);
            glMatrix.vec3.normalize(moveDir, moveDir);
            glMatrix.vec3.scale(amtToMove, moveDir, scaleMovement);
            if(operation == 4)
                glMatrix.vec3.sub(this.positionVector, this.positionVector, amtToMove);
            else if(operation == 5)
                glMatrix.vec3.add(this.positionVector, this.positionVector, amtToMove);
        }

        glMatrix.vec3.add(moveView, this.positionVector, this.viewDirection);
        glMatrix.mat4.lookAt(this.matrix, this.positionVector, moveView, this.UP);
    }

    // 0 = look down, 1 = look up, 2 = look left, 3 = look right
    rotate(operation, angle){
        let rotAmount = glMatrix.mat4.create();
        let moveView = glMatrix.vec3.create();

        if(operation < 2){
            let rotAxis = glMatrix.vec3.create();
            glMatrix.vec3.cross(rotAxis, this.viewDirection, this.UP);
            glMatrix.vec3.normalize(rotAxis, rotAxis);

            if(operation == 0)
                glMatrix.mat4.fromRotation(rotAmount, -1 * angle * Math.PI/180, rotAxis);
            else if (operation == 1)
                glMatrix.mat4.fromRotation(rotAmount, angle * Math.PI/180, rotAxis);  
             
            let temp_up = glMatrix.vec4.fromValues(this.UP[0], this.UP[1], this.UP[2], 1);
            glMatrix.vec4.transformMat4(temp_up, temp_up, rotAmount);
            this.UP = glMatrix.vec3.fromValues(temp_up[0], temp_up[1], temp_up[2]);

        }
        else if(operation == 2)
            glMatrix.mat4.fromRotation(rotAmount, angle * Math.PI/180, this.UP);
        else if(operation == 3)
            glMatrix.mat4.fromRotation(rotAmount, -1 * angle * Math.PI/180, this.UP);

        let temp_view = glMatrix.vec4.fromValues(this.viewDirection[0], this.viewDirection[1], this.viewDirection[2], 1);
        glMatrix.vec4.transformMat4(temp_view, temp_view, rotAmount);
        this.viewDirection = glMatrix.vec3.fromValues(temp_view[0], temp_view[1], temp_view[2]);

        glMatrix.vec3.add(moveView, this.positionVector, this.viewDirection);
        glMatrix.mat4.lookAt(this.matrix, this.positionVector, moveView, this.UP);
    }
}   