
import gpytorch
from gpytorch.models import ExactGP
from gpytorch.kernels import GaussianSymmetrizedKLKernel, ScaleKernel, InducingPointKernel
from gpytorch.means import ConstantMean

from gpytorch.variational import CholeskyVariationalDistribution
from gpytorch.variational import VariationalStrategy
import torch

class IndependentMultitaskGPModelApproximate(gpytorch.models.ApproximateGP):
    def __init__(self, inducing_points_num, input_dim, num_tasks):
        # Let's use a different set of inducing points for each task
        inducing_points = torch.rand(num_tasks, inducing_points_num, input_dim)

        # We have to mark the CholeskyVariationalDistribution as batch
        # so that we learn a variational distribution for each task
        variational_distribution = gpytorch.variational.CholeskyVariationalDistribution(
            inducing_points.size(-2), batch_shape=torch.Size([num_tasks]) )

        variational_strategy = gpytorch.variational.IndependentMultitaskVariationalStrategy(
            gpytorch.variational.VariationalStrategy( self, inducing_points, variational_distribution, learn_inducing_locations=True),
            num_tasks=num_tasks,)

        super().__init__(variational_strategy)

        # The mean and covariance modules should be marked as batch
        # so we learn a different set of hyperparameters
        self.mean_module = gpytorch.means.ConstantMean(batch_shape=torch.Size([num_tasks]))
        self.covar_module = gpytorch.kernels.ScaleKernel(
            gpytorch.kernels.RBFKernel(batch_shape=torch.Size([num_tasks], ard_num_dims=input_dim)),
            batch_shape=torch.Size([num_tasks]) )
        
        # self.covar_module = gpytorch.kernels.ScaleKernel(
            # gpytorch.kernels.MaternKernel(nu=1.5, batch_shape=torch.Size([num_tasks])),
            # batch_shape=torch.Size([num_tasks]) )

    def forward(self, x):
        # The forward function should be written as if we were dealing with each output
        # dimension in batch
        mean_x = self.mean_module(x)
        covar_x = self.covar_module(x)
        return gpytorch.distributions.MultivariateNormal(mean_x, covar_x)