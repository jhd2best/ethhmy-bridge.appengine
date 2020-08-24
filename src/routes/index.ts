import { asyncHandler, createError } from './helpers';
import { IServices } from '../services/init';

export const routes = (app, services: IServices) => {
  // create new BUSD transfer operation
  app.post(
    '/busd/operations',
    asyncHandler(async (req, res) => {
      // TODO: validateOperationParams(req.body)

      const operation = await services.operations.create(req.body);

      return res.json(operation);
    })
  );

  // get BUSD operation info by ID
  app.get(
    '/busd/operations/:id',
    asyncHandler(async (req, res) => {
      const data = await services.operations.getOperationById(req.params.id);

      if (!data) {
        throw createError(400, 'Operation not found');
      }

      return res.json(data);
    })
  );

  // get all BUSD operations filtered by one|eth address
  app.get(
    '/busd/operations',
    asyncHandler(async (req, res) => {
      const { ethAddress, oneAddress } = req.query;

      const data = await services.operations.getAllOperations({ ethAddress, oneAddress });

      return res.json(data);
    })
  );
};
