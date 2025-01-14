import { BadRequestException, Body, Controller, Delete, Get, HttpException, HttpStatus, Param, ParseFilePipeBuilder, Post, Put, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ProductService } from '../services/product.service';
import { IProductDTO } from '../dto/product.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('/product')
export class ProductController {

    constructor(private productService: ProductService) { }

    @Get()
    async allProducts() {
        const products = await this.productService.getAllProducts();
        if (!products) {
            throw new HttpException('No se pudieron obtener los productos', HttpStatus.INTERNAL_SERVER_ERROR);
        }
        return products;
    }

    @Delete(':id')
    async deleteProduct(@Param('id') id: number) {
        const productToEliminate = await this.productService.deleteProductById(id);
        if (!productToEliminate) {
            throw new HttpException('Error!!! No se pudo eliminar el producto', HttpStatus.NOT_FOUND);
        }
        return productToEliminate;
    }

    @Put(':id')
    @UseInterceptors(FileInterceptor('file'))
    async updateProductById(
        @Param('id') id: string,
        @UploadedFile(
            new ParseFilePipeBuilder()
                .addFileTypeValidator({
                    fileType: /(jpg|jpeg|png|gif)$/,
                })
                .addMaxSizeValidator({
                    maxSize: 1024000,
                    message: 'La imagen no puede superar el 1MB',
                })
                .build({ errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY })
        )
        file: Express.Multer.File,
        @Body('data') productData: string
    ) {
        try {
            const product: IProductDTO = JSON.parse(productData);
            // Necesito pasar el precio que me viene como string a numero 
            const priceInNumber: number = +product.price;
            const idNumber: number = +product.id;

            product.id = idNumber;
            product.price = priceInNumber;

            const updateProduct = await this.productService.updateProductWithImage(idNumber, product, file);
            if (!updateProduct) {
                throw new HttpException('Hay un error!!! No se pudo actualizar el producto', HttpStatus.INTERNAL_SERVER_ERROR)
            }
            return updateProduct;

        } catch (error) {
            throw new BadRequestException('Error con la informacion recivida del producto')
        }
    }

    @Post('/create-product')
    @UseInterceptors(FileInterceptor('file'))
    async createProductWithImage(@UploadedFile(
        new ParseFilePipeBuilder()
            .addFileTypeValidator({
                fileType: /(jpg|jpeg|png|gif)$/,
            })
            .addMaxSizeValidator({
                maxSize: 1024000,
                message: 'La imagen no puede superar el 1MB',
            })
            /*
            Este error dice que el servidor entiende el tipo de contenido de la solicitud,
            la sintaxis tambien es correcta,
            pero no pudo procesar las instrucciones necesarias
            */
            .build({ errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY })
    )
    file: Express.Multer.File,
        @Body('data') productData: string
    ) {
        try {
            const product: IProductDTO = JSON.parse(productData);
            // Necesito pasar el precio que me viene como string a numero 
            const priceInNumber: number = +product.price
            product.price = priceInNumber;

            const createdProduct = await this.productService.createProduct(product, file);
            if (!createdProduct) {
                throw new HttpException('Ocurrio un error al crear el producto', HttpStatus.INTERNAL_SERVER_ERROR)
            }
            return createdProduct;

        } catch (error) {
            throw new BadRequestException('Error con la informacion recivida del producto')
        }
    }
}
